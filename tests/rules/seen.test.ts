import { afterAll, beforeAll, beforeEach, describe, it } from "@jest/globals";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from "firebase/firestore";

import { ALICE, as, BOB, createEnv, LIST, seed } from "./setup";

let env: RulesTestEnvironment;
beforeAll(async () => { env = await createEnv(); });
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
});

// Alice's record of what she has seen on the list, as `uid` reaches it.
const seen = (uid: string, owner = ALICE) => doc(as(env, uid).firestore(), "users", owner, "seen", LIST);
const start = (extra: object = {}) => ({ listId: LIST, since: serverTimestamp(), itemIds: [], ...extra });

describe("seen items", () => {
  it("can be started, read, updated and deleted by their owner", async () => {
    await assertSucceeds(setDoc(seen(ALICE), start()));
    await assertSucceeds(getDoc(seen(ALICE)));
    await assertSucceeds(updateDoc(seen(ALICE), { itemIds: ["item1", "item2"] }));
    await assertSucceeds(deleteDoc(seen(ALICE)));
  });

  it("are nobody else's business", async () => {
    await setDoc(seen(ALICE), start());
    await assertFails(getDoc(seen(BOB)));
    await assertFails(updateDoc(seen(BOB), { itemIds: [] }));
    await assertFails(setDoc(doc(as(env, BOB).firestore(), "users", ALICE, "seen", "other"),
      { listId: "other", since: serverTimestamp(), itemIds: [] }));
  });

  it("start now, for the list they're named after, with only the allowed fields", async () => {
    await assertFails(setDoc(seen(ALICE), start({ since: Timestamp.fromMillis(0) })));
    await assertFails(setDoc(seen(ALICE), start({ listId: "other" })));
    await assertFails(setDoc(seen(ALICE), start({ extra: true })));
    await assertFails(setDoc(seen(ALICE), start({ itemIds: "item1" })));
  });

  it("keep when they started, and hold at most 1000 ids", async () => {
    await setDoc(seen(ALICE), start());
    await assertFails(updateDoc(seen(ALICE), { since: serverTimestamp() }));
    await assertFails(updateDoc(seen(ALICE), { listId: "other" }));
    const ids = (n: number) => Array.from({ length: n }, (_, i) => `i${i}`);
    await assertSucceeds(updateDoc(seen(ALICE), { itemIds: ids(1000) }));
    await assertFails(updateDoc(seen(ALICE), { itemIds: ids(1001) }));
  });
});
