import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { subscribeToLists } from "@/api/lists";
import { ShoppingList } from "@/types/models";

type Snapshot = { docs: { id: string; data: () => Record<string, unknown> }[] };
type Listener = { query: string; onNext: (snap: Snapshot) => void; onError: (error: unknown) => void };
const mockListeners: Listener[] = [];

jest.mock("@/api/firebase", () => ({
  ...jest.requireActual<typeof import("@/api/errors")>("@/api/errors"),
  db: {},
}));
// Queries are plain strings here, so the test can tell the listeners apart.
jest.mock("@/api/queries", () => ({
  myGroupsQuery: (userId: string) => `groups of ${userId}`,
  groupListsQuery: (groupId: string) => `lists of ${groupId}`,
}));
jest.mock("firebase/firestore", () => ({
  onSnapshot: (query: string, onNext: Listener["onNext"], onError: Listener["onError"]) => {
    mockListeners.push({ query, onNext, onError });
    return () => {};
  },
}));

const listener = (query: string) => mockListeners.filter((l) => l.query === query).at(-1)!;
const groups = (...ids: string[]): Snapshot => ({ docs: ids.map((id) => ({ id, data: () => ({}) })) });
const lists = (groupId: string, ...names: string[]): Snapshot => ({
  docs: names.map((name) => ({ id: name, data: () => ({ name, groupId, ownerId: "anna" }) })),
});

describe("subscribeToLists", () => {
  let received: ShoppingList[][];
  let errors: string[];

  beforeEach(() => {
    mockListeners.length = 0;
    received = [];
    errors = [];
    subscribeToLists("anna", (l) => received.push(l), (e) => errors.push(e.key));
    listener("groups of anna").onNext(groups("g1", "g2"));
  });

  it("waits until every group has answered", () => {
    listener("lists of g1").onNext(lists("g1", "ICA"));
    expect(received).toHaveLength(0);
    listener("lists of g2").onNext(lists("g2", "Coop"));
    expect(received.at(-1)!.map((l) => l.name)).toEqual(["ICA", "Coop"]);
  });

  it("counts a failed group as empty, so the others still show, and reports the failure", () => {
    // An index that's still building; not mapped, so it's logged in dev.
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    listener("lists of g1").onNext(lists("g1", "ICA"));
    listener("lists of g2").onError({ code: "failed-precondition" });
    warn.mockRestore();
    expect(received.at(-1)!.map((l) => l.name)).toEqual(["ICA"]);
    expect(errors).toEqual(["errors.unknown"]);
  });

  it("doesn't report being denied a group I just left", () => {
    listener("lists of g1").onNext(lists("g1", "ICA"));
    listener("lists of g2").onError({ code: "permission-denied" });
    expect(received.at(-1)!.map((l) => l.name)).toEqual(["ICA"]);
    expect(errors).toEqual([]);
  });

  it("reports a failed groups listener", () => {
    listener("groups of anna").onError({ code: "unavailable" });
    expect(errors).toEqual(["errors.offline"]);
  });
});
