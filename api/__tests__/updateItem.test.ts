import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { updateItem } from "@/api/items";

type Write = { type: "update" | "set"; path: string; data: Record<string, unknown> };
const mockWrites: Write[] = [];
const DELETE = "<deleteField>";

jest.mock("@/api/firebase", () => ({
  ...jest.requireActual<typeof import("@/api/errors")>("@/api/errors"),
  db: {},
  currentUid: () => "anna",
}));
jest.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  deleteField: () => "<deleteField>",
  writeBatch: () => ({
    update: (path: string, data: Record<string, unknown>) => mockWrites.push({ type: "update", path, data }),
    set: (path: string, data: Record<string, unknown>) => mockWrites.push({ type: "set", path, data }),
    commit: () => Promise.resolve(),
  }),
}));

describe("updateItem", () => {
  beforeEach(() => {
    mockWrites.length = 0;
  });

  it("saves name, amount and category as me, and remembers the category for the new name", async () => {
    await updateItem({ itemId: "i1", listId: "l1", name: "Fil", amount: "2 l", category: "dairy" }, "anna");
    expect(mockWrites).toEqual([
      { type: "update", path: "items/i1", data: { name: "Fil", amount: "2 l", category: "dairy", updatedBy: "anna" } },
      { type: "set", path: "lists/l1/knownItems/fil", data: { name: "Fil", category: "dairy" } },
    ]);
  });

  it("removes a left-out amount and category, and leaves the remembered category alone", async () => {
    await updateItem({ itemId: "i1", listId: "l1", name: "Fil" }, "anna");
    expect(mockWrites).toEqual([
      { type: "update", path: "items/i1", data: { name: "Fil", amount: DELETE, category: DELETE, updatedBy: "anna" } },
    ]);
  });
});
