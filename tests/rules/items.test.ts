import { afterAll, beforeAll, beforeEach, describe, it } from "@jest/globals";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import { ALICE, as, BOB, createEnv, EVE, ITEM, LIST, seed } from "./setup";

let env: RulesTestEnvironment;
beforeAll(async () => { env = await createEnv(); });
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
});

const item = (uid: string, id = ITEM) => doc(as(env, uid).firestore(), "items", id);
const newItem = (uid: string, extra: object = {}) => ({
  listId: LIST, name: "Bröd", done: false, addedBy: uid, updatedBy: uid, createdAt: serverTimestamp(), ...extra,
});

describe("adding items", () => {
  it("works for members", async () => {
    await assertSucceeds(setDoc(item(ALICE, "new"), newItem(ALICE, { amount: "2 st", category: "bread" })));
  });

  it("is denied outside the group", async () => {
    await assertFails(setDoc(item(EVE, "new"), newItem(EVE)));
  });

  it("can't be done in someone else's name", async () => {
    await assertFails(setDoc(item(ALICE, "new"), newItem(ALICE, { addedBy: BOB })));
  });

  it("checks the name, amount and category", async () => {
    await assertFails(setDoc(item(ALICE, "a"), newItem(ALICE, { name: "" })));
    await assertFails(setDoc(item(ALICE, "b"), newItem(ALICE, { name: "x".repeat(101) })));
    await assertSucceeds(setDoc(item(ALICE, "c"), newItem(ALICE, { name: "x".repeat(100) })));
    await assertFails(setDoc(item(ALICE, "d"), newItem(ALICE, { amount: "x".repeat(31) })));
    await assertFails(setDoc(item(ALICE, "e"), newItem(ALICE, { category: "candy" })));
  });

  it("can't start out checked or carry extra fields", async () => {
    await assertFails(setDoc(item(ALICE, "a"), newItem(ALICE, { done: true })));
    await assertFails(setDoc(item(ALICE, "b"), newItem(ALICE, { price: 10 })));
  });
});

describe("changing items", () => {
  it("lets members check them off", async () => {
    await assertSucceeds(updateDoc(item(ALICE), { done: true, updatedBy: ALICE }));
  });

  it("doesn't allow other edits", async () => {
    await assertFails(updateDoc(item(ALICE), { name: "Fil", updatedBy: ALICE }));
    await assertFails(updateDoc(item(ALICE), { addedBy: ALICE, updatedBy: ALICE }));
    await assertFails(updateDoc(item(ALICE), { done: true, updatedBy: BOB }));
  });

  it("is denied outside the group", async () => {
    await assertFails(getDoc(item(EVE)));
    await assertFails(updateDoc(item(EVE), { done: true, updatedBy: EVE }));
    await assertFails(deleteDoc(item(EVE)));
  });

  it("lets members delete them", async () => {
    await assertSucceeds(deleteDoc(item(ALICE)));
  });
});

describe("after a list is deleted", () => {
  it("its items are hidden before the cleanup function runs", async () => {
    await deleteDoc(doc(as(env, BOB).firestore(), "lists", LIST));
    await assertFails(getDoc(item(BOB)));
  });
});
