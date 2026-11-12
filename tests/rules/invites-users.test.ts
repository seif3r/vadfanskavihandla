import { afterAll, beforeAll, beforeEach, describe, it } from "@jest/globals";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { ALICE, as, BOB, createEnv, EVE, GROUP, seed } from "./setup";

let env: RulesTestEnvironment;
beforeAll(async () => { env = await createEnv(); });
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
});

const CODE = "abcdefghij0123456789";
const invite = (uid: string, code = CODE) => doc(as(env, uid).firestore(), "invites", code);
const newInvite = (uid: string) => ({ groupId: GROUP, groupName: "Home", createdBy: uid, createdAt: serverTimestamp() });

describe("invites", () => {
  it("can be created by any member", async () => {
    await assertSucceeds(setDoc(invite(BOB), newInvite(BOB)));
  });

  it("can't be created outside the group or with a made-up code", async () => {
    await assertFails(setDoc(invite(EVE), newInvite(EVE)));
    await assertFails(setDoc(invite(BOB, "short"), newInvite(BOB)));
  });

  it("can only be read by the group's owner", async () => {
    await assertSucceeds(setDoc(invite(BOB), newInvite(BOB)));
    await assertSucceeds(getDoc(invite(ALICE)));
    await assertFails(getDoc(invite(EVE)));
  });

  it("can be revoked by its creator or the owner, not by others", async () => {
    await assertSucceeds(setDoc(invite(BOB), newInvite(BOB)));
    await assertFails(deleteDoc(invite(EVE)));
    await assertSucceeds(deleteDoc(invite(ALICE)));
  });
});

describe("users", () => {
  const user = (uid: string, id = uid) => doc(as(env, uid).firestore(), "users", id);
  const settings = { language: "sv", theme: "system", notifications: { itemAdded: true, itemRemoved: false } };

  it("can create and read only their own document", async () => {
    await assertSucceeds(setDoc(user(EVE), { name: "Eve", email: "eve@example.com", settings }));
    await assertSucceeds(getDoc(user(EVE)));
    await assertFails(getDoc(user(ALICE, EVE)));
  });

  it("can't save unknown settings", async () => {
    await assertFails(setDoc(user(EVE), {
      name: "Eve", email: "eve@example.com", settings: { ...settings, language: "de" },
    }));
  });

  it("can save push tokens only for themselves", async () => {
    const token = (uid: string, owner: string) =>
      doc(as(env, uid).firestore(), "users", owner, "pushTokens", "ExponentPushToken[abc]");
    const data = { platform: "android", updatedAt: serverTimestamp() };
    await assertSucceeds(setDoc(token(EVE, EVE), data));
    await assertFails(setDoc(token(EVE, ALICE), data));
  });
});

describe("pending notifications", () => {
  it("are out of reach for every client", async () => {
    await assertFails(getDoc(doc(as(env, ALICE).firestore(), "pendingNotifications", "x")));
  });
});
