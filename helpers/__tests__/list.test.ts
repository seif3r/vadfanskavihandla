import { describe, expect, it } from "@jest/globals";
import { categoryChanges, cleanName, itemKey, rememberCategory, sortItems } from "@/helpers/list";
import { Item } from "@/types/models";

const item = (id: string, extra: Partial<Item> = {}): Item => ({
  id, listId: "list", name: id, done: false, addedBy: "user", ...extra,
});

describe("cleanName", () => {
  it("trims whitespace", () => {
    expect(cleanName("  Mjölk \n")).toBe("Mjölk");
  });
  it("returns null when nothing is left", () => {
    expect(cleanName("")).toBeNull();
    expect(cleanName("   ")).toBeNull();
  });
});

describe("itemKey", () => {
  it("is the same regardless of case and surrounding spaces", () => {
    expect(itemKey("Äpple")).toBe(itemKey(" äpple "));
    expect(itemKey("ÄPPLE")).toBe(itemKey("äpple"));
  });
  it("never contains characters Firestore ids can't have", () => {
    for (const name of ["a/b", ".", "..", "1.5 l"]) {
      const key = itemKey(name);
      expect(key).not.toMatch(/[/.]/);
      expect(key).not.toBe("");
    }
  });
  it("keeps different names apart", () => {
    expect(itemKey("a/b")).not.toBe(itemKey("ab"));
  });
});

describe("sortItems", () => {
  it("puts checked items last", () => {
    const sorted = sortItems([item("a", { done: true }), item("b")]);
    expect(sorted.map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("sorts by category in picker order, items without one last", () => {
    const sorted = sortItems([
      item("none"), item("drinks", { category: "drinks" }), item("produce", { category: "produce" }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual(["produce", "drinks", "none"]);
  });

  it("keeps the added order within a category", () => {
    const sorted = sortItems([
      item("milk", { category: "dairy" }), item("bread", { category: "bread" }), item("cheese", { category: "dairy" }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual(["milk", "cheese", "bread"]);
  });

  it("doesn't change the array it's given", () => {
    const items = [item("a", { done: true }), item("b")];
    sortItems(items);
    expect(items.map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("rememberCategory", () => {
  it("replaces what's remembered for the same name, in any case", () => {
    const known = [{ name: "Mjölk", category: "dairy" as const }, { name: "Bröd", category: "bread" as const }];
    expect(rememberCategory(known, "mjölk ", "drinks")).toEqual([
      { name: "Bröd", category: "bread" },
      { name: "mjölk ", category: "drinks" },
    ]);
  });
  it("adds a name it hasn't seen", () => {
    expect(rememberCategory([], "Ost", "dairy")).toEqual([{ name: "Ost", category: "dairy" }]);
  });
});

describe("categoryChanges", () => {
  const milk = item("i1", { name: "Mjölk", category: "dairy" });

  it("finds new items with a category", () => {
    expect(categoryChanges([], [milk])).toEqual([milk]);
  });
  it("finds items whose name or category changed", () => {
    const renamed = { ...milk, name: "Filmjölk" };
    const recategorized = { ...milk, category: "drinks" as const };
    expect(categoryChanges([milk], [renamed])).toEqual([renamed]);
    expect(categoryChanges([milk], [recategorized])).toEqual([recategorized]);
  });
  it("skips unchanged items, items without a category, and other changes", () => {
    const bread = item("i2", { name: "Bröd" });
    expect(categoryChanges([milk], [milk, bread])).toEqual([]);
    expect(categoryChanges([milk], [{ ...milk, done: true }])).toEqual([]);
  });
  it("finds nothing on the first snapshot", () => {
    expect(categoryChanges(undefined, [milk])).toEqual([]);
  });
});
