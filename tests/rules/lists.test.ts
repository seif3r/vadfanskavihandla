import { afterAll, beforeAll, beforeEach, describe, it } from "@jest/globals";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import { ALICE, as, BOB, createEnv, EVE, GROUP, LIST, seed } from "./setup";

let env: RulesTestEnvironment;
beforeAll(async () => { env = await createEnv(); });
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
});

const list = (uid: string, id = LIST) => doc(as(env, uid).firestore(), "lists", id);

describe("lists", () => {
  it("are visible to the group's members only", async () => {
    await assertSucceeds(getDoc(list(ALICE)));
    await assertFails(getDoc(list(EVE)));
  });

  it("can be created by members, in their own name", async () => {
    const data = { name: "Willys", groupId: GROUP, createdAt: serverTimestamp() };
    await assertSucceeds(setDoc(list(ALICE, "new"), { ...data, ownerId: ALICE }));
    await assertFails(setDoc(list(ALICE, "new2"), { ...data, ownerId: BOB }));
    await assertFails(setDoc(list(EVE, "new3"), { ...data, ownerId: EVE }));
  });

  it("can be renamed by members but not moved to another group", async () => {
    await assertSucceeds(updateDoc(list(ALICE), { name: "Coop" }));
    await assertFails(updateDoc(list(ALICE), { groupId: "other" }));
    await assertFails(updateDoc(list(ALICE), { name: "x".repeat(51) }));
  });

  it("can be deleted by its creator", async () => {
    await assertSucceeds(deleteDoc(list(BOB)));
  });

  it("can be deleted by the group's owner", async () => {
    await assertSucceeds(deleteDoc(list(ALICE)));
  });

  it("can't be deleted by other members", async () => {
    const data = { name: "Alice's", groupId: GROUP, ownerId: ALICE, createdAt: serverTimestamp() };
    await assertSucceeds(setDoc(list(ALICE, "alices"), data));
    await assertFails(deleteDoc(list(BOB, "alices")));
  });
});

describe("known items", () => {
  const known = (uid: string) => doc(as(env, uid).firestore(), "lists", LIST, "knownItems", "mjölk");

  it("can be saved by members with a valid category", async () => {
    await assertSucceeds(setDoc(known(BOB), { name: "Mjölk", category: "dairy" }));
    await assertFails(setDoc(known(BOB), { name: "Mjölk", category: "candy" }));
    await assertFails(setDoc(known(EVE), { name: "Mjölk", category: "dairy" }));
  });
});
