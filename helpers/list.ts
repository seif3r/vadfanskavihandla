import { categories } from "@/helpers/categories";
import { Item } from "@/types/models";

// Trims a typed-in name (item, list, ...). Returns null if nothing is left, so callers can skip empty input.
export function cleanName(text: string): string | null {
  const trimmed = text.trim();
  return trimmed ? trimmed : null;
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
