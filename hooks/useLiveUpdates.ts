import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/ApiError";
import { subscribeToGroups } from "@/api/groups";
import { subscribeToItems } from "@/api/items";
import { subscribeToLists } from "@/api/lists";
import { startSeen, subscribeToSeen } from "@/api/seen";
import { getUsers } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { NOTIFICATION_DELAY_SECONDS } from "@/constants/limits";
import { useLists } from "@/hooks/useLists";
import { memberKey } from "@/helpers/groups";
import { canReceivePush, showNotification } from "@/helpers/notifications";
import { categoryChanges, rememberCategory } from "@/helpers/list";
import { Group, Item, ItemChange, KnownItem, PendingNotification } from "@/types/models";

// Same as the server: a person's changes to a list are collected until they've been quiet for
// NOTIFICATION_DELAY_SECONDS (per type), then shown as one notification.
// A listener that failed is stopped for good, so all of them are started again after this long.
export const LIVE_RETRY_MS = 15 * 1000;

// Keeps groups, lists and items live for every group the user is in, and turns other people's
// changes into notifications if the user has turned them on. Mount once.
// Installed builds get those as push notifications from the server instead, so they aren't shown twice.
// Returns why the data isn't live right now, if a listener has failed, or null.
export function useLiveUpdates(): ApiError | null {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { lists } = useLists();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: members } = useQuery({ queryKey: ["users"], queryFn: getUsers, enabled: !!userId });

  const pending = useRef(new Map<string, PendingNotification>());

  // Failed listeners by what they listen to ("groups", "lists", "items:<listId>"). A source is
  // removed again when it delivers data. While any has failed, every listener is restarted
  // after LIVE_RETRY_MS (attempt is in their effects' dependencies).
  const [failures, setFailures] = useState<Record<string, ApiError>>({});
  const [attempt, setAttempt] = useState(0);
  const failed = (source: string) => (error: ApiError) =>
    setFailures((current) => ({ ...current, [source]: error }));
  const delivered = (source: string) =>
    setFailures((current) => {
      if (!(source in current)) return current;
      const { [source]: _recovered, ...rest } = current;
      return rest;
    });
  // A list that is gone (deleted, or I left its group) no longer counts.
  const current = Object.entries(failures)
    .filter(([source]) => !source.startsWith("items:") || lists.some((l) => `items:${l.id}` === source))
    .map(([, error]) => error);
  const hasFailures = current.length > 0;
  useEffect(() => {
    if (!hasFailures) return;
    const timer = setTimeout(() => setAttempt((n) => n + 1), LIVE_RETRY_MS);
    return () => clearTimeout(timer);
  }, [hasFailures, attempt]);
  // A new session starts without the old one's failures.
  useEffect(() => setFailures({}), [userId]);

  // Reads the latest settings, names and translations without re-subscribing.
  const show = useEffectEvent((batch: PendingNotification) => {
    const who = members?.find((m) => m.id === batch.userId)?.name ?? "";
    const listName = lists.find((l) => l.id === batch.listId)?.name ?? "";
    // Who and whether it was one item, never which, same as the push from the server.
    const body =
      batch.itemIds.size === 1
        ? t(`notifications.${batch.type}`, { user: who })
        : t(`notifications.${batch.type}Many`, { user: who });
    showNotification(listName, body);
  });

  const notify = useEffectEvent((change: ItemChange) => {
    if (canReceivePush || !user?.settings.notifications[change.type]) return;
    // Someone who just joined isn't in the cached members yet.
    if (!members?.some((m) => m.id === change.userId)) queryClient.invalidateQueries({ queryKey: ["users"] });
    const key = `${change.item.listId}_${change.userId}_${change.type}`;
    const batch: PendingNotification = pending.current.get(key) ?? {
      listId: change.item.listId,
      userId: change.userId,
      type: change.type,
      itemIds: new Set(),
      timer: undefined,
    };
    batch.itemIds.add(change.item.id);
    // Every change restarts the wait.
    clearTimeout(batch.timer);
    batch.timer = setTimeout(() => {
      pending.current.delete(key);
      show(batch);
    }, NOTIFICATION_DELAY_SECONDS[change.type] * 1000);
    pending.current.set(key, batch);
  });

  // Drop unsent batches on logout or unmount; they belong to that session.
  useEffect(() => {
    const batches = pending.current;
    return () => {
      batches.forEach((batch) => clearTimeout(batch.timer));
      batches.clear();
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    return subscribeToGroups(userId, (fresh) => {
      delivered("groups");
      const old = queryClient.getQueryData<Group[]>(["groups"]);
      queryClient.setQueryData(["groups"], fresh);
      // Someone joined or left: fetch names again, so new members aren't nameless.
      if (memberKey(old) !== memberKey(fresh)) queryClient.invalidateQueries({ queryKey: ["users"] });
    }, failed("groups"));
  }, [userId, queryClient, attempt]);

  useEffect(() => {
    if (!userId) return;
    return subscribeToLists(userId, (fresh) => {
      delivered("lists");
      queryClient.setQueryData(["lists"], fresh);
    }, failed("lists"));
  }, [userId, queryClient, attempt]);

  // What the user has seen, for all lists in one listener. A list with nothing yet starts being
  // tracked now (once per session), so only what others add from now on counts as new. Only once
  // the server has answered: the device's cache alone may lack lists the server tracks.
  const started = useRef(new Set<string>());
  const [seenListIds, setSeenListIds] = useState<string[] | null>(null);
  useEffect(() => {
    if (!userId) return;
    return subscribeToSeen(userId, (fresh, isFromServer) => {
      delivered("seen");
      queryClient.setQueryData(["seen"], fresh);
      if (isFromServer) setSeenListIds(Object.keys(fresh));
    }, failed("seen"));
  }, [userId, queryClient, attempt]);
  useEffect(() => {
    if (!userId || !seenListIds) return;
    lists
      .filter((list) => !seenListIds.includes(list.id) && !started.current.has(list.id))
      .forEach((list) => {
        started.current.add(list.id);
        // If it fails, the next session tries again; until then nothing on the list counts as new.
        startSeen(userId, list.id).catch(() => started.current.delete(list.id));
      });
  }, [userId, lists, seenListIds]);
  // A new session starts over.
  useEffect(() => {
    started.current.clear();
    setSeenListIds(null);
  }, [userId]);

  // One listener per list. A string key, so a new array with the same lists doesn't re-subscribe.
  const listIds = lists.map((l) => l.id).join(",");
  useEffect(() => {
    if (!userId || !listIds) return;
    const stops = listIds.split(",").map((listId) =>
      subscribeToItems(listId, userId, (items, changes) => {
        delivered(`items:${listId}`);
        const previous = queryClient.getQueryData<Item[]>(["items", listId]);
        queryClient.setQueryData(["items", listId], items);
        // Categories others just chose (added or edited) go into the list's memory, so typing the
        // same name here suggests them without loading the memory again. A memory that isn't
        // loaded yet is left alone: it loads complete when the list is opened.
        const chosen = categoryChanges(previous, items);
        if (chosen.length > 0 && queryClient.getQueryData(["knownItems", listId])) {
          queryClient.setQueryData<KnownItem[]>(["knownItems", listId], (known = []) =>
            chosen.reduce((all, item) => rememberCategory(all, item.name, item.category), known),
          );
        }
        changes.forEach((change) => notify(change));
      }, failed(`items:${listId}`)),
    );
    return () => stops.forEach((stop) => stop());
  }, [userId, listIds, queryClient, attempt]);

  return current[0] ?? null;
}
