/**
 * Sends push notifications when someone adds or removes items, to the
 * other members of the list's group who have that notification switched
 * on. Checking items off is personal and sends nothing.
 *
 * Changes are not pushed one by one: a person's changes to a list are
 * collected until they've been quiet for a minute and sent as one
 * notification ("Anna added 3 items: ..."), so a shopping trip doesn't
 * buzz everyone's phone per item.
 *
 * Also cleans up after deletes: the app only deletes a group or list
 * document, and everything under it is deleted here, with no limit on how
 * much there is.
 *
 * Joining a group happens here too, since the rules can't let someone add
 * themselves to a group they can't read.
 */
import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore, Query} from "firebase-admin/firestore";
import {getFunctions} from "firebase-admin/functions";
import {setGlobalOptions} from "firebase-functions";
import * as logger from "firebase-functions/logger";
import {
  onDocumentDeleted, onDocumentWrittenWithAuthContext,
} from "firebase-functions/v2/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {onTaskDispatched} from "firebase-functions/v2/tasks";
import {readFileSync} from "fs";
import {join} from "path";

import {
  BatchTask, ChangeType, JoinGroupRequest, Language, PendingBatch, PushMessage,
  Texts,
} from "./types";

initializeApp();
// Cloud Functions isn't offered in europe-north2 (Stockholm), where the
// database is. Finland is the nearest region that has it; the Firestore
// trigger itself still lives with the database. Few instances: this only
// reacts to a household's taps.
const region = "europe-north1";
// Cloud Tasks isn't offered in either Nordic region, so the queue and the
// function it calls live in Belgium. A push that waits a minute anyway
// doesn't notice the extra distance.
const tasksRegion = "europe-west1";
setGlobalOptions({region, maxInstances: 5});
const db = getFirestore();

const DELAY_SECONDS = 60;
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
// Without one, a hanging request holds the task until it times out.
const EXPO_TIMEOUT_MS = 10_000;
// Same number as INVITE_LIFETIME_DAYS in the app's constants/limits.ts.
const INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
// Firestore's generated ids, the only codes the rules allow. Checked before
// the code goes into a path, so a "/" can't point at another document.
const INVITE_CODE = /^[A-Za-z0-9]{20}$/;

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

/**
 * Fills in a notification text. One pass over the template, with a function
 * as the replacement: a name containing "{{item}}" or "$&" stays as written.
 * @param {string} template The text with {{placeholders}}.
 * @param {Record<string, string>} values What each placeholder becomes.
 * @return {string} The finished text.
 */
function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(
    /{{(\w+)}}/g, (match, key: string) => values[key] ?? match);
}

// Adds the caller to the group an invite code points to. Each error code
// becomes its own message in the app (toApiError in api/firebase.ts).
export const joinGroup = onCall<JoinGroupRequest>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Not logged in");
  const code = request.data?.code;
  const invalid = new HttpsError("invalid-argument", "Invalid invite code");
  if (typeof code !== "string" || !INVITE_CODE.test(code)) throw invalid;

  await db.runTransaction(async (tx) => {
    const invite = await tx.get(db.doc(`invites/${code}`));
    // Codes made before groups existed point to a list instead.
    const groupId = invite.get("groupId");
    if (!groupId) throw invalid;
    const groupRef = db.doc(`groups/${groupId}`);
    const group = await tx.get(groupRef);
    if (!group.exists) throw invalid;

    const members: string[] = group.get("members") ?? [];
    if (members.includes(uid)) return;
    const removed: string[] = group.get("removedMembers") ?? [];
    if (removed.includes(uid)) {
      throw new HttpsError("permission-denied", "Removed from this group");
    }
    const createdAt: number = invite.get("createdAt")?.toMillis() ?? 0;
    // A code dies with its creator's membership: whoever was removed or left
    // shouldn't have codes out there that still work.
    if (
      Date.now() > createdAt + INVITE_LIFETIME_MS ||
      !members.includes(invite.get("createdBy"))
    ) {
      throw new HttpsError("failed-precondition", "Invite has expired");
    }
    tx.update(groupRef, {members: FieldValue.arrayUnion(uid)});
  });
});

// "WithAuthContext" because a deleted item can't say who deleted it.
// retry: if the transaction or the enqueue fails, the batch would sit in
// pendingNotifications with no task to send it. Running again is safe: the
// item is keyed by id, and only the task for the latest seq sends.
export const notifyOnItemChange = onDocumentWrittenWithAuthContext(
  {document: "items/{itemId}", retry: true},
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

    // The server only deletes items while cleaning up a deleted list, and
    // nobody is left to tell about those.
    const byServer =
      event.authType === "service_account" || event.authType === "system";
    if (type === "itemRemoved" && byServer) return;
    // Adds carry updatedBy (the rules make it the author). For deletes, the
    // auth context names the signed-in user who did it.
    const actorId: string | undefined = type === "itemRemoved" ?
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
      `locations/${tasksRegion}/functions/sendBatchedNotification`);
    await queue.enqueue({batchId, seq}, {scheduleDelaySeconds: DELAY_SECONDS});
  },
);

export const sendBatchedNotification = onTaskDispatched<BatchTask>(
  {
    region: tasksRegion,
    retryConfig: {maxAttempts: 3, minBackoffSeconds: 30},
  },
  async (request) => {
    const {batchId, seq} = request.data;
    const ref = db.doc(`pendingNotifications/${batchId}`);
    // Moves the items to "sending" in one go, so changes arriving now start
    // a new batch instead of being lost. The doc itself stays so seq never
    // repeats and a late, retried task can't send someone else's batch early.
    const batch = await db.runTransaction(async (tx) => {
      const pending = await tx.get(ref);
      // A later change has its own task coming. It also sends whatever is
      // still in "sending" from this one.
      if (!pending.exists || pending.get("seq") !== seq) return null;
      const data = pending.data() as PendingBatch;
      // What an earlier, failed attempt didn't get out, plus anything new.
      const sending = {...data.sending, ...data.items};
      if (Object.keys(sending).length === 0) return null;
      tx.update(ref, {items: FieldValue.delete(), sending});
      return {...data, items: sending};
    });
    if (!batch) return;
    // Throws if Expo can't be reached or answers with an error, so Cloud
    // Tasks tries again; "sending" still holds the items then.
    await sendPush(batch);
    // Only the items sent, in case a newer task has added more meanwhile.
    await ref.update(Object.fromEntries(Object.keys(batch.items).map(
      (itemId) => [`sending.${itemId}`, FieldValue.delete()])));
  },
);

/**
 * Sends one notification about a batch of changes to every other member
 * of the list's group who wants it.
 * @param {PendingBatch} batch The collected changes.
 */
async function sendPush(batch: PendingBatch): Promise<void> {
  const {listId, actorId, type} = batch;
  const names = Object.values(batch.items ?? {});
  if (names.length === 0) return;

  const list = await db.doc(`lists/${listId}`).get();
  if (!list.exists) return;
  const actor = await db.doc(`profiles/${actorId}`).get();
  // Everyone in the list's group sees it, so they're the ones to tell.
  const group = await db.doc(`groups/${list.get("groupId")}`).get();
  const members: string[] = group.get("members") ?? [];
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
    const body = fillTemplate(template, {
      user: actor.get("name") ?? "",
      item: names[0],
      count: String(names.length),
      items: names.join(", "),
    });
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

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(sends.map((send) => send.message)),
    signal: AbortSignal.timeout(EXPO_TIMEOUT_MS),
  });
  if (!response.ok) {
    const details = {
      listId, type, recipients: sends.length, status: response.status,
      response: await response.text(),
    };
    logger.error("Expo push failed", details);
    // The task is retried, and the items are still in "sending" for it.
    throw new Error(`Expo push failed with status ${response.status}`);
  }

  // Tickets come back in the same order as the messages. Forget tokens
  // for phones where the app was uninstalled.
  const {data: tickets} = await response.json() as {
    data: { status: string; details?: { error?: string } }[];
  };
  // Other errors (too big, rate limited) mean that phone missed this one.
  // Logged, not retried: resending would repeat it on the phones that got it.
  tickets.forEach((ticket, i) => {
    const error = ticket.details?.error;
    if (ticket.status === "error" && error !== "DeviceNotRegistered") {
      logger.warn("Expo push ticket error", {listId, type, error,
        userId: sends[i]?.userId});
    }
  });
  await Promise.all(
    sends
      .filter((_send, i) =>
        tickets[i]?.details?.error === "DeviceNotRegistered")
      .map(({userId, message}) =>
        db.doc(`users/${userId}/pushTokens/${message.to}`).delete()),
  );
}

/**
 * Deletes every document a query matches. BulkWriter batches and retries
 * the deletes, without the 500-writes limit of a single batch.
 * @param {Query} query Which documents to delete.
 */
async function deleteWhere(query: Query): Promise<void> {
  // select() with no fields: only the ids are needed.
  const snap = await query.select().get();
  const writer = db.bulkWriter();
  snap.docs.forEach((doc) => writer.delete(doc.ref));
  await writer.close();
}

// Triggers can fire more than once and are retried on failure; deleting
// what is already gone does nothing, so running twice is harmless.

// A list is gone: delete its items, remembered categories and notification
// batches.
export const cleanUpList = onDocumentDeleted(
  {document: "lists/{listId}", retry: true},
  async (event) => {
    const {listId} = event.params;
    await db.recursiveDelete(db.collection(`lists/${listId}/knownItems`));
    await deleteWhere(db.collection("items").where("listId", "==", listId));
    await deleteWhere(
      db.collection("pendingNotifications").where("listId", "==", listId));
  },
);

// A group is gone: delete its lists (each of which then triggers
// cleanUpList) and the invite codes to it.
export const cleanUpGroup = onDocumentDeleted(
  {document: "groups/{groupId}", retry: true},
  async (event) => {
    const {groupId} = event.params;
    await deleteWhere(
      db.collection("lists").where("groupId", "==", groupId));
    await deleteWhere(
      db.collection("invites").where("groupId", "==", groupId));
  },
);
