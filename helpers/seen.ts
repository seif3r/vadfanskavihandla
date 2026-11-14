import { Item, SeenState } from "@/types/models";
import { RowLayout } from "@/types/components";

// The list's items that are new to the user: added by someone else after tracking started, and
// not seen since. Nothing is new before the seen state has loaded.
export function unseenItems(items: Item[], seen: SeenState | undefined, userId: string | undefined): Item[] {
  if (!seen || !userId) return [];
  const seenIds = new Set(seen.itemIds);
  return items.filter((item) => item.addedBy !== userId && (item.createdAt ?? 0) > seen.since && !seenIds.has(item.id));
}

// Seen ids worth keeping: those still on the list, once each. Keeps the document as small as the list.
export function pruneSeen(itemIds: Iterable<string>, items: Item[]): string[] {
  const onList = new Set(items.map((item) => item.id));
  return [...new Set(itemIds)].filter((id) => onList.has(id));
}

// The rows that are at least partly on screen. Row positions are relative to the start of the
// scrolled content; the visible part runs from scrollY to scrollY + viewportHeight.
export function visibleItemIds(rows: Record<string, RowLayout>, scrollY: number, viewportHeight: number): string[] {
  const bottom = scrollY + viewportHeight;
  return Object.entries(rows)
    .filter(([, row]) => row.y < bottom && row.y + row.height > scrollY)
    .map(([id]) => id);
}
