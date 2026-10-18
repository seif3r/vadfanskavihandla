/**
 * Types for the Cloud Functions. functions/ is deployed on its own, so it
 * can't import the app's types/; this file plays the same role here.
 */

export type ChangeType = "itemAdded" | "itemRemoved";
export type Language = "en" | "sv";

// The part of the app's locale files the functions read.
export interface Texts {
  notifications: Record<ChangeType | `${ChangeType}Many`, string>;
}

// One message to Expo's push service.
export interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  channelId: "default";
}

// A doc in pendingNotifications. Server-only collection: no Security Rule
// matches it, so clients can't read or write it.
export interface PendingBatch {
  listId: string;
  actorId: string;
  type: ChangeType;
  // Keyed by item id, so the same item changed twice counts once.
  items: Record<string, string>;
  // Bumped by every change; only the task for the latest change sends.
  seq: number;
}

// Payload of a sendBatchedNotification task.
export interface BatchTask {
  batchId: string;
  seq: number;
}
