import {getFirestore} from "firebase-admin/firestore";

import {cleanUpGroup, cleanUpList} from "../src/index";
import {clearFirestore, GROUP, LIST, seedGroup} from "./helpers";

const db = getFirestore();
// Only run() is used; the event type differs per trigger.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Trigger = {run: (event: any) => unknown};

/**
 * Runs a delete trigger as if the document had just been deleted.
 * @param {object} fn The trigger.
 * @param {object} params The path's wildcards.
 * @return {Promise<void>} When the cleanup is done.
 */
function deleted(fn: Trigger, params: object) {
  return fn.run({params, data: undefined});
}

const count = async (path: string) => (await db.collection(path).get()).size;

beforeEach(async () => {
  await clearFirestore();
  await seedGroup();
  await db.doc("lists/other").set({name: "Other", groupId: "elsewhere"});
  for (const listId of [LIST, "other"]) {
    await db.doc(`items/${listId}-item`).set({listId, name: "Mjölk"});
    await db.doc(`lists/${listId}/knownItems/mjölk`).set(
      {name: "Mjölk", category: "dairy"});
    await db.doc(`pendingNotifications/${listId}_a_itemAdded`).set({listId});
  }
  await db.doc("invites/code1").set({groupId: GROUP});
  await db.doc("invites/code2").set({groupId: "elsewhere"});
});

describe("cleanUpList", () => {
  it("deletes the list's items, known items and pending batches", async () => {
    await db.doc(`lists/${LIST}`).delete();
    await deleted(cleanUpList, {listId: LIST});

    expect((await db.doc(`items/${LIST}-item`).get()).exists).toBe(false);
    expect(await count(`lists/${LIST}/knownItems`)).toBe(0);
    const batch = await db.doc(`pendingNotifications/${LIST}_a_itemAdded`)
      .get();
    expect(batch.exists).toBe(false);
  });

  it("leaves other lists alone", async () => {
    await deleted(cleanUpList, {listId: LIST});
    expect((await db.doc("items/other-item").get()).exists).toBe(true);
    expect(await count("lists/other/knownItems")).toBe(1);
  });

  it("can run twice", async () => {
    await deleted(cleanUpList, {listId: LIST});
    await deleted(cleanUpList, {listId: LIST});
  });
});

describe("cleanUpGroup", () => {
  it("deletes the group's lists and invites, nothing else", async () => {
    await deleted(cleanUpGroup, {groupId: GROUP});
    expect((await db.doc(`lists/${LIST}`).get()).exists).toBe(false);
    expect((await db.doc("invites/code1").get()).exists).toBe(false);
    expect((await db.doc("lists/other").get()).exists).toBe(true);
    expect((await db.doc("invites/code2").get()).exists).toBe(true);
  });
});
