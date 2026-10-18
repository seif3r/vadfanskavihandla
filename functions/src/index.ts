/**
 * Sends push notifications when someone adds or removes items, to the
 * list's other members who have that notification switched on. Checking
 * items off is personal and sends nothing.
 *
 * Changes are not pushed one by one: a person's changes to a list are
 * collected until they've been quiet for a minute and sent as one
 * notification ("Anna added 3 items: ..."), so a shopping trip doesn't
 * buzz everyone's phone per item.
 */
import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {getFunctions} from "firebase-admin/functions";
import {setGlobalOptions} from "firebase-functions";
import * as logger from "firebase-functions/logger";
import {
  onDocumentWrittenWithAuthContext,
} from "firebase-functions/v2/firestore";
import {onTaskDispatched} from "firebase-functions/v2/tasks";
import {readFileSync} from "fs";
import {join} from "path";

import {
  BatchTask, ChangeType, Language, PendingBatch, PushMessage, Texts,
} from "./types";

initializeApp();
// Cloud Functions isn't offered in europe-north2 (Stockholm), where the
// database is. Finland is the nearest region that has it; the Firestore
// trigger itself still lives with the database. Few instances: this only
// reacts to a household's taps.
const region = "europe-north1";
setGlobalOptions({region, maxInstances: 5});
const db = getFirestore();

const DELAY_SECONDS = 60;

/**
 * Reads the app's own translations, copied into locales/ by the build
 * script, so notification texts are only translated in one place.
 * @param {Language} language The language code.
 * @return {Texts} The parsed locale file.
 */
function loadTexts(language: Language): Texts {
  const file = join(__dirname, "..", "locales", `${language}.json`);
  return JSON.parse(readFileSync(file, "utf8"));
}
const texts: Record<Language, Texts> = {
  en: loadTexts("en"),
  sv: loadTexts("sv"),
};

// "WithAuthContext" because a deleted item can't say who deleted it.
export const notifyOnItemChange = onDocumentWrittenWithAuthContext(
  "items/{itemId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    let type: ChangeType;
    let item;
    if (!before && after) {
      type = "itemAdded";
      item = after;
    } else if (before && !after) {
      type = "itemRemoved";
      item = before;
    } else {
      return; // Edits and checking off aren't news.
    }

    // Adds carry updatedBy (the rules make it the author). For deletes, the
    // auth context names the signed-in user who did it.
    const byServer =
      event.authType === "service_account" || event.authType === "system";
    const actorId: string | undefined = type === "itemRemoved" && !byServer ?
      event.authId ?? item.updatedBy : item.updatedBy;
    if (!actorId) return;
    const batchId = `${item.listId}_${actorId}_${type}`;
    const ref = db.doc(`pendingNotifications/${batchId}`);

    const seq = await db.runTransaction(async (tx) => {
      const pending = await tx.get(ref);
      const next = (pending.get("seq") ?? 0) + 1;
      tx.set(ref, {
        listId: item.listId,
        actorId,
        type,
        items: {[event.params.itemId]: item.name},
        seq: next,
      }, {merge: true});
      return next;
    });

    // Every change schedules a send a minute out. Earlier tasks see a newer
    // seq and do nothing, so it goes out a minute after the last change.
    const queue = getFunctions().taskQueue<BatchTask>(
      `locations/${region}/functions/sendBatchedNotification`);
    await queue.enqueue({batchId, seq}, {scheduleDelaySeconds: DELAY_SECONDS});
  },
);

export const sendBatchedNotification = onTaskDispatched<BatchTask>(
  {retryConfig: {maxAttempts: 3, minBackoffSeconds: 30}},
  async (request) => {
    const {batchId, seq} = request.data;
    const ref = db.doc(`pendingNotifications/${batchId}`);
    // Read and empty in one go, so changes arriving now start a new batch
    // instead of being lost. The doc itself stays so seq never repeats and
    // a late, retried task can't send someone else's batch early.
    const batch = await db.runTransaction(async (tx) => {
      const pending = await tx.get(ref);
      // A later change has its own task coming.
      if (!pending.exists || pending.get("seq") !== seq) return null;
      tx.update(ref, {items: FieldValue.delete()});
      return pending.data() as PendingBatch;
    });
    if (!batch) return;
    await sendPush(batch);
  },
);

/**
 * Sends one notification about a batch of changes to every other member
 * of the list who wants it.
 * @param {PendingBatch} batch The collected changes.
 */
async function sendPush(batch: PendingBatch): Promise<void> {
  const {listId, actorId, type} = batch;
  const names = Object.values(batch.items ?? {});
  if (names.length === 0) return;

  const list = await db.doc(`lists/${listId}`).get();
  if (!list.exists) return;
  const actor = await db.doc(`profiles/${actorId}`).get();
  const members: string[] = list.get("members") ?? [];
  const recipients = members.filter((id) => id !== actorId);

  // Each message remembers whose token it is, so dead tokens can be removed.
  const sends: { userId: string; message: PushMessage }[] = [];
  for (const userId of recipients) {
    const user = await db.doc(`users/${userId}`).get();
    if (!user.get(`settings.notifications.${type}`)) continue;
    const language: Language =
      user.get("settings.language") === "en" ? "en" : "sv";
    const template = names.length === 1 ?
      texts[language].notifications[type] :
      texts[language].notifications[`${type}Many`];
    const body = template
      .replace("{{user}}", actor.get("name") ?? "")
      .replace("{{item}}", names[0])
      .replace("{{count}}", String(names.length))
      .replace("{{items}}", names.join(", "));
    const tokens = await db.collection(`users/${userId}/pushTokens`).get();
    tokens.forEach((token) => sends.push({
      userId,
      message: {
        to: token.id,
        title: list.get("name"),
        body,
        sound: "default",
        channelId: "default",
      },
    }));
  }
  if (sends.length === 0) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(sends.map((send) => send.message)),
  });
  if (!response.ok) {
    logger.error("Expo push failed", response.status, await response.text());
    return;
  }

  // Tickets come back in the same order as the messages. Forget tokens
  // for phones where the app was uninstalled.
  const {data: tickets} = await response.json() as {
    data: { status: string; details?: { error?: string } }[];
  };
  await Promise.all(
    sends
      .filter((_send, i) =>
        tickets[i]?.details?.error === "DeviceNotRegistered")
      .map(({userId, message}) =>
        db.doc(`users/${userId}/pushTokens/${message.to}`).delete()),
  );
}
