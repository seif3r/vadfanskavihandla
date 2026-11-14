import { describe, expect, it } from "@jest/globals";

import { pruneSeen, unseenItems, visibleItemIds } from "@/helpers/seen";
import { Item, SeenState } from "@/types/models";

const item = (id: string, addedBy: string, createdAt: number): Item =>
  ({ id, listId: "l1", name: id, done: false, addedBy, createdAt });
const seen = (since: number, itemIds: string[] = []): SeenState => ({ listId: "l1", since, itemIds });

describe("unseenItems", () => {
  const items = [item("old", "bob", 50), item("mine", "anna", 150), item("seen", "bob", 160), item("new", "bob", 170)];

  it("is what others added after tracking started and I haven't seen", () => {
    expect(unseenItems(items, seen(100, ["seen"]), "anna").map((i) => i.id)).toEqual(["new"]);
  });
  it("counts checked-off items too", () => {
    expect(unseenItems([{ ...item("new", "bob", 170), done: true }], seen(100), "anna")).toHaveLength(1);
  });
  it("is nothing before the seen state or the user is known", () => {
    expect(unseenItems(items, undefined, "anna")).toEqual([]);
    expect(unseenItems(items, seen(100), undefined)).toEqual([]);
  });
  it("is nothing on a list only I add to, like My lists", () => {
    expect(unseenItems([item("a", "anna", 500)], seen(100), "anna")).toEqual([]);
  });
});

describe("pruneSeen", () => {
  it("keeps the ids still on the list, once each", () => {
    expect(pruneSeen(["a", "gone", "b", "a"], [item("a", "bob", 1), item("b", "bob", 1)])).toEqual(["a", "b"]);
  });
});

describe("visibleItemIds", () => {
  const rows = {
    above: { y: 0, height: 50 },
    partlyAbove: { y: 80, height: 50 },
    inside: { y: 200, height: 50 },
    partlyBelow: { y: 480, height: 50 },
    below: { y: 600, height: 50 },
  };
  it("is every row at least partly on screen", () => {
    expect(visibleItemIds(rows, 100, 400).sort()).toEqual(["inside", "partlyAbove", "partlyBelow"]);
  });
  it("leaves out rows that only touch the edge", () => {
    expect(visibleItemIds({ edge: { y: 50, height: 50 } }, 100, 400)).toEqual([]);
  });
});
