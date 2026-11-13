import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/ApiError";
import { subscribeToGroups } from "@/api/groups";
import { subscribeToItems } from "@/api/items";
import { subscribeToLists } from "@/api/lists";
import { getUsers } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { NOTIFICATION_DELAY_SECONDS } from "@/constants/limits";
import { useLists } from "@/hooks/useLists";
import { memberKey } from "@/helpers/groups";
import { canReceivePush, showNotification } from "@/helpers/notifications";
import { Group, ItemChange, PendingNotification } from "@/types/models";

// Same as the server: a person's changes to a list are collected until they've been quiet for a minute,
// then shown as one notification.
const DELAY_MS = NOTIFICATION_DELAY_SECONDS * 1000;
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
    const names = [...batch.items.values()];
    const body =
      names.length === 1
        ? t(`notifications.${batch.type}`, { user: who, item: names[0] })
        : t(`notifications.${batch.type}Many`, { user: who, count: names.length, items: names.join(", ") });
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
      items: new Map(),
      timer: undefined,
    };
    batch.items.set(change.item.id, change.item.name);
    // Every change restarts the minute.
    clearTimeout(batch.timer);
    batch.timer = setTimeout(() => {
      pending.current.delete(key);
      show(batch);
    }, DELAY_MS);
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

  // One listener per list. A string key, so a new array with the same lists doesn't re-subscribe.
  const listIds = lists.map((l) => l.id).join(",");
  useEffect(() => {
    if (!userId || !listIds) return;
    const stops = listIds.split(",").map((listId) =>
      subscribeToItems(listId, userId, (items, changes) => {
        delivered(`items:${listId}`);
        queryClient.setQueryData(["items", listId], items);
        changes.forEach((change) => notify(change));
      }, failed(`items:${listId}`)),
    );
    return () => stops.forEach((stop) => stop());
  }, [userId, listIds, queryClient, attempt]);

  return current[0] ?? null;
}
