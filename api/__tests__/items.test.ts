import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { removeDone, setAllDone } from "@/api/items";

type Op = { type: "update" | "delete"; ref: string };
const mockCommits: Op[][] = [];
let mockDocs: { ref: string; data: () => Record<string, unknown> }[] = [];

jest.mock("@/api/firebase", () => ({
  ...jest.requireActual<typeof import("@/api/errors")>("@/api/errors"),
  db: {},
  currentUid: () => "anna",
}));
jest.mock("firebase/firestore", () => ({
  collection: () => ({}),
  query: () => ({}),
  where: () => ({}),
  orderBy: () => ({}),
  getDocs: () => Promise.resolve({ docs: mockDocs }),
  writeBatch: () => {
    const ops: Op[] = [];
    return {
      update: (ref: string) => ops.push({ type: "update", ref }),
      delete: (ref: string) => ops.push({ type: "delete", ref }),
      commit: () => {
        mockCommits.push(ops);
        return Promise.resolve();
      },
    };
  },
}));

const items = (count: number, data: Record<string, unknown>) =>
  Array.from({ length: count }, (_, i) => ({
    ref: `items/${i}`,
    id: String(i),
    data: () => ({ listId: "l1", name: `vara ${i}`, addedBy: "bob", ...data }),
  }));

describe("long lists (over Firestore's 500 writes per batch)", () => {
  beforeEach(() => {
    mockCommits.length = 0;
  });

  it("checks off every item, 500 at a time", async () => {
    mockDocs = items(1201, { done: false, updatedBy: "bob" });
    await setAllDone("l1", true, "anna");
    expect(mockCommits.map((ops) => ops.length)).toEqual([500, 500, 201]);
  });

  it("stamps every item before deleting any, 500 at a time", async () => {
    mockDocs = items(600, { done: true, updatedBy: "bob" });
    await removeDone("l1");
    expect(mockCommits.map((ops) => [ops[0].type, ops.length])).toEqual([
      ["update", 500], ["update", 100], ["delete", 500], ["delete", 100],
    ]);
  });

  it("doesn't stamp items I already changed last", async () => {
    mockDocs = items(3, { done: true, updatedBy: "anna" });
    await removeDone("l1");
    expect(mockCommits.map((ops) => ops[0].type)).toEqual(["delete"]);
  });
});
