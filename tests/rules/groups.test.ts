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

describe("the personal group", () => {
  const personal = (uid: string, id = `personal_${uid}`) => doc(as(env, uid).firestore(), "groups", id);
  const data = (uid: string, extra: object = {}) =>
    ({ personal: true, ownerId: uid, members: [uid], createdAt: serverTimestamp(), ...extra });
  const create = () => setDoc(personal(EVE), data(EVE));

  it("can be created with your own id, with only you in it", async () => {
    await assertSucceeds(create());
  });
  it("can't be made for someone else, under another id, or with others in it", async () => {
    await assertFails(setDoc(personal(EVE, `personal_${ALICE}`), data(ALICE)));
    await assertFails(setDoc(personal(EVE, `personal_${ALICE}`), data(EVE)));
    await assertFails(setDoc(personal(EVE, "other"), data(EVE)));
    await assertFails(setDoc(personal(EVE), data(EVE, { members: [EVE, ALICE] })));
    await assertFails(setDoc(personal(EVE), data(EVE, { name: "Mine" })));
  });
  it("can be looked up by its owner before it exists, but not by others", async () => {
    await assertSucceeds(getDoc(personal(EVE)));
    await create();
    await assertSucceeds(getDoc(personal(EVE)));
    await assertFails(getDoc(personal(ALICE, `personal_${EVE}`)));
  });
  it("has an id no ordinary group can take", async () => {
    await assertFails(setDoc(doc(as(env, EVE).firestore(), "groups", `personal_${ALICE}`),
      { name: "Mine", ownerId: EVE, members: [EVE], createdAt: serverTimestamp() }));
  });
  it("can't be faked on an ordinary group", async () => {
    await assertFails(setDoc(doc(as(env, EVE).firestore(), "groups", "new"),
      { name: "Mine", ownerId: EVE, members: [EVE], createdAt: serverTimestamp(), personal: true }));
  });
  it("can't be renamed, changed, left or deleted", async () => {
    await create();
    await assertFails(updateDoc(personal(EVE), { name: "Shared" }));
    await assertFails(updateDoc(personal(EVE), { members: [EVE, ALICE] }));
    await assertFails(updateDoc(personal(EVE), { personal: false }));
    await assertFails(updateDoc(personal(EVE), { members: arrayRemove(EVE), ownerId: null }));
    await assertFails(deleteDoc(personal(EVE)));
  });
  it("can't be created a second time over the first", async () => {
    await create();
    await assertFails(setDoc(personal(EVE), data(EVE)));
  });
  it("can't get invite codes", async () => {
    await create();
    await assertFails(setDoc(doc(as(env, EVE).firestore(), "invites", "AbCdEfGhIj0123456789"),
      { groupId: `personal_${EVE}`, groupName: "Mine", createdBy: EVE, createdAt: serverTimestamp() }));
  });
  it("holds lists and items like any group", async () => {
    await create();
    const db = as(env, EVE).firestore();
    await assertSucceeds(setDoc(doc(db, "lists", "mine"),
      { name: "Apotek", groupId: `personal_${EVE}`, ownerId: EVE, createdAt: serverTimestamp() }));
    await assertSucceeds(setDoc(doc(db, "items", "pill"), {
      listId: "mine", name: "Alvedon", done: false, addedBy: EVE, updatedBy: EVE, createdAt: serverTimestamp(),
    }));
    await assertFails(getDoc(doc(as(env, ALICE).firestore(), "lists", "mine")));
  });
});
