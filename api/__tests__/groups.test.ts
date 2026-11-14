import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { leaveGroup, subscribeToInvites } from "@/api/groups";
import { Group, Invite } from "@/types/models";

type Snapshot = { docs: { id: string; data: () => Record<string, unknown> }[] };
const mockUpdates: Record<string, unknown>[] = [];
let mockInvitesListener: (snap: Snapshot) => void;

jest.mock("@/api/firebase", () => ({
  ...jest.requireActual<typeof import("@/api/errors")>("@/api/errors"),
  db: {},
  currentUid: () => "anna",
}));
// Field values are plain objects here, so the test can read what was sent.
jest.mock("firebase/firestore", () => ({
  arrayRemove: (value: string) => ({ arrayRemove: value }),
  collection: () => ({}),
  doc: () => ({}),
  query: () => ({}),
  where: () => ({}),
  updateDoc: async (_ref: unknown, data: Record<string, unknown>) => {
    mockUpdates.push(data);
  },
  onSnapshot: (_query: unknown, onNext: (snap: Snapshot) => void) => {
    mockInvitesListener = onNext;
    return () => {};
  },
}));
jest.mock("firebase/functions", () => ({}));

const DAY_MS = 24 * 60 * 60 * 1000;
const group = (ownerId: string, memberIds: string[]): Group => ({
  id: "g", name: "Home", ownerId, memberIds, removedMemberIds: [],
});

describe("leaveGroup", () => {
  beforeEach(() => {
    mockUpdates.length = 0;
  });

  it("only removes a member who isn't the owner", async () => {
    await leaveGroup(group("bert", ["bert", "anna"]));
    expect(mockUpdates).toEqual([{ members: { arrayRemove: "anna" } }]);
  });

  it("hands the group to the longest-standing other member when the owner leaves", async () => {
    await leaveGroup(group("anna", ["anna", "bert", "cecilia"]));
    expect(mockUpdates).toEqual([{ members: { arrayRemove: "anna" }, ownerId: "bert" }]);
  });

  it("doesn't let the last member leave", async () => {
    await expect(leaveGroup(group("anna", ["anna"]))).rejects.toMatchObject({ key: "errors.lastMember" });
    expect(mockUpdates).toEqual([]);
  });
});

describe("subscribeToInvites", () => {
  let received: Invite[];
  const invite = (code: string, createdAt: number) => ({
    id: code,
    data: () => ({ createdBy: "anna", createdAt: { toMillis: () => createdAt } }),
  });

  beforeEach(() => {
    subscribeToInvites("g", (invites) => {
      received = invites;
    });
  });

  it("leaves out codes older than 7 days, and lists the one expiring first first", () => {
    const now = Date.now();
    mockInvitesListener({
      docs: [invite("new", now - DAY_MS), invite("expired", now - 8 * DAY_MS), invite("old", now - 6 * DAY_MS)],
    });
    expect(received.map((i) => i.code)).toEqual(["old", "new"]);
    expect(received[0].expiresAt).toBe(now + DAY_MS);
  });
});
