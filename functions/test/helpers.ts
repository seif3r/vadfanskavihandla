/**
 * Shared fixtures for the function tests.
 */
import {getFirestore, Timestamp} from "firebase-admin/firestore";

export const ALICE = "alice";
export const BOB = "bob";
export const EVE = "eve";
export const GROUP = "group1";
export const LIST = "list1";

/**
 * Deletes everything in the emulator's database.
 */
export async function clearFirestore(): Promise<void> {
  const db = getFirestore();
  const collections = await db.listCollections();
  await Promise.all(collections.map((c) => db.recursiveDelete(c)));
}

/**
 * A group Alice owns with Bob in it, and one list in it.
 */
export async function seedGroup(): Promise<void> {
  const db = getFirestore();
  await db.doc(`groups/${GROUP}`).set({
    name: "Home", ownerId: ALICE, members: [ALICE, BOB],
    createdAt: Timestamp.now(),
  });
  await db.doc(`lists/${LIST}`).set({
    name: "ICA", groupId: GROUP, ownerId: ALICE, createdAt: Timestamp.now(),
  });
}

/**
 * Stands in for a Firestore DocumentSnapshot in a trigger's event.
 * @param {object | undefined} value The document's data, or undefined if it
 *     doesn't exist.
 * @return {object} Something with the data() a trigger reads.
 */
export function snapshot(value?: Record<string, unknown>) {
  return {data: () => value};
}
