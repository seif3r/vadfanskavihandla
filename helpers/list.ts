import { categories } from "@/helpers/categories";
import { Category, Item, KnownItem } from "@/types/models";

// Trims a typed-in name (item, list, ...). Returns null if nothing is left, so callers can skip empty input.
export function cleanName(text: string): string | null {
  const trimmed = text.trim();
  return trimmed ? trimmed : null;
}

// The same key for "Äpple", "äpple " and "ÄPPLE", usable as a Firestore document id
// ("/" and "." are escaped, since ids can't contain "/" or be "." or "..").
export function itemKey(name: string): string {
  return encodeURIComponent(name.trim().toLocaleLowerCase()).replace(/\./g, "%2E");
}

// Position of an item's category in the picker order; items without a category go last.
function categoryRank(item: Item): number {
  return item.category ? categories.indexOf(item.category) : categories.length;
}

// Unchecked items first, then checked ones. Within each group, sorted by category
// (in picker order); within a category, in the order the items were added.
export function sortItems(items: Item[]): Item[] {
  // Array.sort is stable, so items with the same category keep their original (added) order.
  const byCategory = [...items].sort((a, b) => categoryRank(a) - categoryRank(b));
  return [...byCategory.filter((item) => !item.done), ...byCategory.filter((item) => item.done)];
}

// The remembered categories with this name's set to category, replacing any earlier one for the
// same name (in any case).
export function rememberCategory(known: KnownItem[], name: string, category: Category): KnownItem[] {
  return [...known.filter((k) => itemKey(k.name) !== itemKey(name)), { name, category }];
}

// Items in fresh that have a category and are new, or whose name or category differs from
// previous: what someone just chose. Nothing when there is no previous snapshot, so the items
// already on a list don't overwrite something remembered later.
export function categoryChanges(previous: Item[] | undefined, fresh: Item[]): (Item & { category: Category })[] {
  if (!previous) return [];
  const before = new Map(previous.map((item) => [item.id, item]));
  return fresh.filter((item): item is Item & { category: Category } => {
    if (!item.category) return false;
    const old = before.get(item.id);
    return !old || old.name !== item.name || old.category !== item.category;
  });
}
