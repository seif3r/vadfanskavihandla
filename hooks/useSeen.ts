import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { getItems } from "@/api/items";
import { getSeen, saveSeen } from "@/api/seen";
import { useAuth } from "@/context/AuthContext";
import { pruneSeen, unseenItems } from "@/helpers/seen";
import { Item, ListCount, SeenState, ShoppingList } from "@/types/models";

// How long seen items are collected on the device before they're saved, so scrolling through a
// list is one write instead of one per item.
export const SEEN_SAVE_DELAY_MS = 3000;

// The user's seen state for every list. Kept live by useLiveUpdates.
export function useSeen(): Record<string, SeenState> | undefined {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["seen"], queryFn: () => getSeen(user!.id), enabled: !!user });
  return data;
}

// How many items each list has, and how many are new to the user. A list whose items haven't
// loaded yet is left out. The items are already on the device: useLiveUpdates listens to every list.
export function useListCounts(lists: ShoppingList[]): Record<string, ListCount> {
  const { user } = useAuth();
  const seen = useSeen();
  const results = useQueries({
    queries: lists.map((list) => ({
      queryKey: ["items", list.id],
      queryFn: () => getItems(list.id),
      // useLiveUpdates keeps them current; no refetching on top.
      staleTime: Infinity,
    })),
  });
  return Object.fromEntries(
    lists.flatMap((list, index) => {
      const items = results[index].data;
      if (!items) return [];
      return [[list.id, { total: items.length, unseen: unseenItems(items, seen?.[list.id], user?.id).length }]];
    }),
  );
}

// Marks items as seen once their rows have been on screen. Collected per list and saved after
// SEEN_SAVE_DELAY_MS, and right away when the list is left or the app goes to the background.
// Returns the function the list screen calls with the ids of the rows it shows.
export function useMarkSeen(listId: string | undefined): (visibleIds: string[]) => void {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const pending = useRef(new Map<string, Set<string>>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Reads the cache, not props, so a flush for a list that was just left uses that list's data.
  const flush = useRef(() => {});
  flush.current = () => {
    clearTimeout(timer.current);
    const seen = queryClient.getQueryData<Record<string, SeenState>>(["seen"]);
    pending.current.forEach((ids, id) => {
      const state = seen?.[id];
      const items = queryClient.getQueryData<Item[]>(["items", id]);
      // Not tracked yet (useLiveUpdates starts it): nothing is new on it, so nothing to save.
      if (!state || !items || !userId) return;
      // Fails only offline for long or without access to the list; the items stay new and are
      // marked again next time they're on screen.
      saveSeen(userId, id, pruneSeen([...state.itemIds, ...ids], items)).catch(() => {});
    });
    pending.current.clear();
  };

  // Leaving a list, or the screen, saves what was seen on it.
  useEffect(() => () => flush.current(), [listId]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") flush.current();
    });
    return () => subscription.remove();
  }, []);

  return (visibleIds: string[]) => {
    // Rows can be laid out while the app is in the background (a change arrives); nobody saw them.
    // Not `!== "active"`: the state can be "unknown" just after start, when the screen is showing.
    const appState = AppState.currentState;
    if (!listId || appState === "background" || appState === "inactive") return;
    const seen = queryClient.getQueryData<Record<string, SeenState>>(["seen"]);
    const items = queryClient.getQueryData<Item[]>(["items", listId]) ?? [];
    const visible = new Set(visibleIds);
    const newlySeen = unseenItems(items, seen?.[listId], userId).filter((item) => visible.has(item.id));
    if (newlySeen.length === 0) return;
    const ids = pending.current.get(listId) ?? new Set<string>();
    const before = ids.size;
    newlySeen.forEach((item) => ids.add(item.id));
    if (ids.size === before) return;
    pending.current.set(listId, ids);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flush.current(), SEEN_SAVE_DELAY_MS);
  };
}
