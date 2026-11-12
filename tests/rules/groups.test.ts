import { afterAll, beforeAll, beforeEach, describe, it } from "@jest/globals";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { arrayRemove, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import { ALICE, as, BOB, createEnv, EVE, GROUP, seed } from "./setup";

let env: RulesTestEnvironment;
beforeAll(async () => { env = await createEnv(); });
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
});

const group = (uid: string) => doc(as(env, uid).firestore(), "groups", GROUP);

describe("reading a group", () => {
  it("is allowed for members", async () => {
    await assertSucceeds(getDoc(group(BOB)));
  });
  it("is denied for others and for signed-out users", async () => {
    await assertFails(getDoc(group(EVE)));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "groups", GROUP)));
  });
});

describe("creating a group", () => {
  const create = (uid: string, data: object) =>
    setDoc(doc(as(env, uid).firestore(), "groups", "new"), { createdAt: serverTimestamp(), ...data });

  it("works with yourself as owner and only member", async () => {
    await assertSucceeds(create(EVE, { name: "Mine", ownerId: EVE, members: [EVE] }));
  });
  it("can't add other people or name someone else owner", async () => {
    await assertFails(create(EVE, { name: "Mine", ownerId: EVE, members: [EVE, ALICE] }));
    await assertFails(create(EVE, { name: "Mine", ownerId: ALICE, members: [EVE] }));
  });
  it("checks the name", async () => {
    await assertFails(create(EVE, { name: "", ownerId: EVE, members: [EVE] }));
    await assertFails(create(EVE, { name: "x".repeat(51), ownerId: EVE, members: [EVE] }));
  });
});

describe("changing a group", () => {
  it("lets the owner rename it, not other members", async () => {
    await assertSucceeds(updateDoc(group(ALICE), { name: "Hemma" }));
    await assertFails(updateDoc(group(BOB), { name: "Hemma" }));
  });

  it("doesn't let anyone add themselves", async () => {
    await assertFails(updateDoc(group(EVE), { members: [ALICE, BOB, EVE] }));
  });

  it("lets a member leave", async () => {
    await assertSucceeds(updateDoc(group(BOB), { members: arrayRemove(BOB) }));
  });

  it("hands the group to the next member when the owner leaves", async () => {
    await assertFails(updateDoc(group(ALICE), { members: [BOB] }));
    await assertSucceeds(updateDoc(group(ALICE), { members: [BOB], ownerId: BOB }));
  });

  it("doesn't let a member remove someone else", async () => {
    await assertFails(updateDoc(group(BOB), { members: [BOB] }));
  });

  it("lets the owner remove a member, who is then remembered", async () => {
    await assertFails(updateDoc(group(ALICE), { members: [ALICE] }));
    await assertSucceeds(updateDoc(group(ALICE), { members: [ALICE], removedMembers: [BOB] }));
  });

  it("lets the owner let a removed member back in", async () => {
    await assertSucceeds(updateDoc(group(ALICE), { members: [ALICE], removedMembers: [BOB] }));
    await assertSucceeds(updateDoc(group(ALICE), { removedMembers: [] }));
  });
});

describe("deleting a group", () => {
  it("is only allowed for the owner", async () => {
    await assertFails(deleteDoc(group(BOB)));
    await assertSucceeds(deleteDoc(group(ALICE)));
  });
});
