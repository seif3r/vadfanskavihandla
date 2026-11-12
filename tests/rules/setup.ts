/// <reference types="node" />
// Shared setup for the Security Rules tests. They run against the Firestore emulator
// (npm run test:rules starts it), never against the real project.
import {
  initializeTestEnvironment, RulesTestContext, RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, setLogLevel, Timestamp } from "firebase/firestore";
import { readFileSync } from "fs";
import { join } from "path";

export const ALICE = "alice"; // Owner of the group
export const BOB = "bob"; // Member
export const EVE = "eve"; // Not in the group
export const GROUP = "group1";
export const LIST = "list1";
export const ITEM = "item1";

// Denied writes are what many tests expect; the SDK would log each one as a warning.
setLogLevel("error");

export async function createEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    // A demo- project id never reaches a real Firebase project.
    projectId: "demo-vadfanskavihandla",
    firestore: { rules: readFileSync(join(__dirname, "..", "..", "firestore.rules"), "utf8") },
  });
}

// A group Alice owns with Bob in it, one list Bob created, and one item on it.
export async function seed(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "groups", GROUP), {
      name: "Home", ownerId: ALICE, members: [ALICE, BOB], createdAt: Timestamp.now(),
    });
    await setDoc(doc(db, "lists", LIST), {
      name: "ICA", groupId: GROUP, ownerId: BOB, createdAt: Timestamp.now(),
    });
    await setDoc(doc(db, "items", ITEM), {
      listId: LIST, name: "Mjölk", done: false, addedBy: BOB, updatedBy: BOB, createdAt: Timestamp.now(),
    });
  });
}

export const as = (env: RulesTestEnvironment, uid: string): RulesTestContext => env.authenticatedContext(uid);
