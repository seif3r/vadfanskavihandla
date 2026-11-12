import {getFirestore} from "firebase-admin/firestore";

import {notifyOnItemChange, sendBatchedNotification} from "../src/index";
import {
  ALICE, BOB, clearFirestore, LIST, seedGroup, snapshot,
} from "./helpers";

// Cloud Tasks isn't emulated here: the tests check what gets scheduled.
const mockEnqueue = jest.fn();
jest.mock("firebase-admin/functions", () => ({
  getFunctions: () => ({taskQueue: () => ({enqueue: mockEnqueue})}),
}));

const db = getFirestore();
const fetchMock = jest.fn();
global.fetch = fetchMock;

/**
 * Runs the item trigger for one change.
 * @param {string} itemId The item's id.
 * @param {object} change The data before and after, and who made it.
 * @return {Promise<void>} When the trigger is done.
 */
function itemChanged(itemId: string, change: {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  authType?: string;
  authId?: string;
}) {
  return notifyOnItemChange.run({
    params: {itemId},
    data: {before: snapshot(change.before), after: snapshot(change.after)},
    authType: change.authType ?? "app_user",
    authId: change.authId,
    // Only the fields the trigger reads.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

const item = (name: string, by = ALICE) =>
  ({listId: LIST, name, done: false, addedBy: by, updatedBy: by});

/**
 * Runs the scheduled send.
 * @param {string} batchId Which batch.
 * @param {number} seq The change it was scheduled for.
 * @return {Promise<void>} When the send is done.
 */
function send(batchId: string, seq: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return sendBatchedNotification.run({data: {batchId, seq}} as any);
}

const pending = async (id: string) =>
  (await db.doc(`pendingNotifications/${id}`).get()).data();

beforeEach(async () => {
  await clearFirestore();
  await seedGroup();
  mockEnqueue.mockReset();
  fetchMock.mockReset();
});

describe("notifyOnItemChange", () => {
  const batchId = `${LIST}_${ALICE}_itemAdded`;

  it("collects adds and schedules a send a minute later", async () => {
    await itemChanged("i1", {after: item("Mjölk")});
    await itemChanged("i2", {after: item("Bröd")});

    expect(await pending(batchId)).toMatchObject({
      listId: LIST, actorId: ALICE, type: "itemAdded", seq: 2,
      items: {i1: "Mjölk", i2: "Bröd"},
    });
    expect(mockEnqueue).toHaveBeenCalledTimes(2);
    expect(mockEnqueue).toHaveBeenLastCalledWith(
      {batchId, seq: 2}, {scheduleDelaySeconds: 60});
  });

  it("ignores checking items off", async () => {
    await itemChanged("i1", {
      before: item("Mjölk"), after: {...item("Mjölk"), done: true},
    });
    expect(await pending(batchId)).toBeUndefined();
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("credits deletes to whoever was signed in", async () => {
    await itemChanged("i1", {before: item("Mjölk"), authId: BOB});
    expect(await pending(`${LIST}_${BOB}_itemRemoved`)).toMatchObject(
      {actorId: BOB, items: {i1: "Mjölk"}});
  });

  it("stays quiet about deletes made by the cleanup", async () => {
    await itemChanged("i1", {before: item("Mjölk"), authType: "system"});
    await itemChanged("i2", {
      before: item("Bröd"), authType: "service_account",
    });
    expect(mockEnqueue).not.toHaveBeenCalled();
  });
});

describe("sendBatchedNotification", () => {
  const batchId = `${LIST}_${ALICE}_itemAdded`;
  const token = "ExponentPushToken[bob]";

  beforeEach(async () => {
    await db.doc(`profiles/${ALICE}`).set({name: "Alice"});
    await db.doc(`users/${BOB}`).set({
      name: "Bob", email: "bob@example.com",
      settings: {
        language: "en", theme: "system",
        notifications: {itemAdded: true, itemRemoved: true},
      },
    });
    await db.doc(`users/${BOB}/pushTokens/${token}`).set({platform: "android"});
    await db.doc(`pendingNotifications/${batchId}`).set({
      listId: LIST, actorId: ALICE, type: "itemAdded", seq: 2,
      items: {i1: "Mjölk", i2: "Bröd"},
    });
    fetchMock.mockResolvedValue({
      ok: true, json: async () => ({data: [{status: "ok"}]}),
    });
  });

  const sentMessages = () => JSON.parse(fetchMock.mock.calls[0][1].body);

  it("sends one bundled push to the other members", async () => {
    await send(batchId, 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentMessages()).toEqual([expect.objectContaining({
      to: token, title: "ICA", body: "Alice added 2 items: Mjölk, Bröd",
    })]);
    // Emptied, so later changes start a new batch.
    expect((await pending(batchId))?.items).toBeUndefined();
  });

  it("writes in the recipient's language", async () => {
    await db.doc(`users/${BOB}`).update({"settings.language": "sv"});
    await db.doc(`pendingNotifications/${batchId}`).update(
      {items: {i1: "Mjölk"}});
    await send(batchId, 2);
    expect(sentMessages()[0].body).toBe("Alice lade till Mjölk");
  });

  it("does nothing when a newer change has its own task coming", async () => {
    await send(batchId, 1);
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await pending(batchId))?.items).toBeDefined();
  });

  it("skips people who switched the notification off", async () => {
    await db.doc(`users/${BOB}`).update(
      {"settings.notifications.itemAdded": false});
    await send(batchId, 2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forgets tokens for uninstalled apps", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({data: [
        {status: "error", details: {error: "DeviceNotRegistered"}},
      ]}),
    });
    await send(batchId, 2);
    const saved = await db.doc(`users/${BOB}/pushTokens/${token}`).get();
    expect(saved.exists).toBe(false);
  });
});
