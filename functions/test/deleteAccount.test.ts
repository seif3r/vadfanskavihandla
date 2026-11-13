import {getFirestore, Timestamp} from "firebase-admin/firestore";

import {deleteAccount} from "../src/index";
import {
  ALICE, BOB, clearFirestore, EVE, GROUP, LIST, seedGroup,
} from "./helpers";

// The Auth emulator isn't running in these tests.
const mockDeleteUser = jest.fn();
jest.mock("firebase-admin/auth", () => ({
  getAuth: () => ({deleteUser: mockDeleteUser}),
}));

const db = getFirestore();
const SOLO_GROUP = "solo";
const SOLO_LIST = "sololist";

/**
 * Calls deleteAccount the way the app does.
 * @param {string | undefined} uid Who is signed in.
 * @return {Promise<unknown>} What the function returns.
 */
function deleteAs(uid: string | undefined) {
  // Only the fields deleteAccount reads.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return deleteAccount.run({auth: uid ? {uid} : undefined, data: {}} as any);
}

const exists = async (path: string) => (await db.doc(path).get()).exists;
const group = async (id = GROUP) => (await db.doc(`groups/${id}`).get()).data();

beforeEach(async () => {
  await clearFirestore();
  await seedGroup();
  mockDeleteUser.mockReset().mockResolvedValue(undefined);
  await db.doc(`users/${ALICE}`).set({name: "Alice", email: "a@example.com"});
  await db.doc(`users/${ALICE}/pushTokens/t1`).set({platform: "android"});
  await db.doc(`profiles/${ALICE}`).set({name: "Alice"});
  await db.doc(`profiles/${BOB}`).set({name: "Bob"});
  await db.doc(`groups/${SOLO_GROUP}`).set({
    name: "Only me", ownerId: ALICE, members: [ALICE],
    createdAt: Timestamp.now(),
  });
  await db.doc(`lists/${SOLO_LIST}`).set({
    name: "Mine", groupId: SOLO_GROUP, ownerId: ALICE,
    createdAt: Timestamp.now(),
  });
});

describe("deleteAccount", () => {
  it("needs a session", async () => {
    await expect(deleteAs(undefined)).rejects.toMatchObject(
      {code: "unauthenticated"});
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("deletes the user's documents and their login", async () => {
    await deleteAs(ALICE);
    expect(await exists(`users/${ALICE}`)).toBe(false);
    expect(await exists(`users/${ALICE}/pushTokens/t1`)).toBe(false);
    expect(await exists(`profiles/${ALICE}`)).toBe(false);
    expect(mockDeleteUser).toHaveBeenCalledWith(ALICE);
    // Other people are untouched.
    expect(await exists(`profiles/${BOB}`)).toBe(true);
  });

  it("leaves shared groups, handing ownership to the next member", async () => {
    await deleteAs(ALICE);
    expect(await group()).toMatchObject({ownerId: BOB, members: [BOB]});
    // Their list there stays with the group.
    expect(await exists(`lists/${LIST}`)).toBe(true);
  });

  it("keeps the owner when a member deletes their account", async () => {
    await deleteAs(BOB);
    expect(await group()).toMatchObject({ownerId: ALICE, members: [ALICE]});
  });

  it("deletes groups nobody else is in", async () => {
    await deleteAs(ALICE);
    // cleanUpGroup then deletes its lists; it isn't triggered in tests.
    expect(await group(SOLO_GROUP)).toBeUndefined();
  });

  it("forgets the user in groups they were removed from", async () => {
    await db.doc(`groups/${GROUP}`).update({removedMembers: [EVE]});
    await deleteAs(EVE);
    expect((await group())?.removedMembers).toEqual([]);
  });

  it("deletes their invite codes and unsent notifications", async () => {
    await db.doc("invites/abcdefghij0123456789").set({
      groupId: GROUP, createdBy: ALICE, createdAt: Timestamp.now(),
    });
    await db.doc(`pendingNotifications/${LIST}_${ALICE}_itemAdded`).set({
      listId: LIST, actorId: ALICE, type: "itemAdded", seq: 1,
      items: {i1: "Mjölk"},
    });
    await deleteAs(ALICE);
    expect(await exists("invites/abcdefghij0123456789")).toBe(false);
    expect(await exists(`pendingNotifications/${LIST}_${ALICE}_itemAdded`))
      .toBe(false);
  });

  it("can be called again when the login couldn't be deleted", async () => {
    mockDeleteUser.mockRejectedValueOnce(new Error("auth down"));
    await expect(deleteAs(ALICE)).rejects.toThrow("auth down");
    await deleteAs(ALICE);
    expect(mockDeleteUser).toHaveBeenCalledTimes(2);
  });
});
