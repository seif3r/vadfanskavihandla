import {getFirestore, Timestamp} from "firebase-admin/firestore";

import {joinGroup} from "../src/index";
import {ALICE, BOB, clearFirestore, EVE, GROUP, seedGroup} from "./helpers";

const CODE = "abcdefghij0123456789";
const DAY_MS = 24 * 60 * 60 * 1000;
const db = getFirestore();

/**
 * Calls joinGroup the way the app does.
 * @param {string | undefined} uid Who is signed in.
 * @param {unknown} code The invite code sent.
 * @return {Promise<unknown>} What the function returns.
 */
function join(uid: string | undefined, code: unknown = CODE) {
  // Only the fields joinGroup reads.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return joinGroup.run({auth: uid ? {uid} : undefined, data: {code}} as any);
}

/**
 * Saves an invite code to the group.
 * @param {string} createdBy Who made it.
 * @param {number} ageMs How long ago.
 */
async function invite(createdBy = BOB, ageMs = 0): Promise<void> {
  await db.doc(`invites/${CODE}`).set({
    groupId: GROUP, groupName: "Home", createdBy,
    createdAt: Timestamp.fromMillis(Date.now() - ageMs),
  });
}

const members = async () =>
  (await db.doc(`groups/${GROUP}`).get()).get("members");

beforeEach(async () => {
  await clearFirestore();
  await seedGroup();
});

describe("joinGroup", () => {
  it("adds the caller to the group", async () => {
    await invite();
    await join(EVE);
    expect(await members()).toEqual([ALICE, BOB, EVE]);
  });

  it("does nothing for someone already in the group", async () => {
    await invite();
    await join(BOB);
    expect(await members()).toEqual([ALICE, BOB]);
  });

  it("needs a signed-in caller", async () => {
    await invite();
    await expect(join(undefined)).rejects.toMatchObject(
      {code: "unauthenticated"});
  });

  it("rejects codes that aren't valid ids", async () => {
    for (const code of [undefined, 42, "short", "../groups/group1abcdef"]) {
      await expect(join(EVE, code)).rejects.toMatchObject(
        {code: "invalid-argument"});
    }
  });

  it("rejects codes that don't exist", async () => {
    await expect(join(EVE)).rejects.toMatchObject({code: "invalid-argument"});
  });

  it("rejects codes to a deleted group", async () => {
    await invite();
    await db.doc(`groups/${GROUP}`).delete();
    await expect(join(EVE)).rejects.toMatchObject({code: "invalid-argument"});
  });

  it("works for 7 days", async () => {
    await invite(BOB, 6 * DAY_MS);
    await join(EVE);
    expect(await members()).toContain(EVE);
  });

  it("rejects codes older than 7 days", async () => {
    await invite(BOB, 8 * DAY_MS);
    await expect(join(EVE)).rejects.toMatchObject(
      {code: "failed-precondition"});
    expect(await members()).not.toContain(EVE);
  });

  it("rejects codes whose creator has left", async () => {
    await invite(EVE);
    await expect(join("someone")).rejects.toMatchObject(
      {code: "failed-precondition"});
  });

  it("doesn't let removed members back in", async () => {
    await invite();
    await db.doc(`groups/${GROUP}`).update({removedMembers: [EVE]});
    await expect(join(EVE)).rejects.toMatchObject(
      {code: "permission-denied"});
    expect(await members()).not.toContain(EVE);
  });
});
