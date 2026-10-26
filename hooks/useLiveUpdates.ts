import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef } from "react";
import { useTranslation } from "react-i18next";

import { subscribeToGroups } from "@/api/groups";
import { subscribeToItems } from "@/api/items";
import { subscribeToLists } from "@/api/lists";
import { getUsers } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { useLists } from "@/context/ListsContext";
import { memberKey } from "@/helpers/groups";
import { canReceivePush, showNotification } from "@/helpers/notifications";
import { Group, ItemChange, PendingNotification } from "@/types/models";

// Same as the server: a person's changes to a list are collected until they've been quiet for a minute,
// then shown as one notification.
const DELAY_MS = 60 * 1000;

// Keeps groups, lists and items live for every group the user is in, and turns other people's
// changes into notifications if the user has turned them on. Mount once.
// Installed builds get those as push notifications from the server instead, so they aren't shown twice.
export function useLiveUpdates() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { lists } = useLists();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: members } = useQuery({ queryKey: ["users"], queryFn: getUsers, enabled: !!userId });

  const pending = useRef(new Map<string, PendingNotification>());

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
      const old = queryClient.getQueryData<Group[]>(["groups"]);
      queryClient.setQueryData(["groups"], fresh);
      // Someone joined or left: fetch names again, so new members aren't nameless.
      if (memberKey(old) !== memberKey(fresh)) queryClient.invalidateQueries({ queryKey: ["users"] });
    });
  }, [userId, queryClient]);

  useEffect(() => {
    if (!userId) return;
    return subscribeToLists(userId, (fresh) => queryClient.setQueryData(["lists"], fresh));
  }, [userId, queryClient]);

  // One listener per list. A string key, so a new array with the same lists doesn't re-subscribe.
  const listIds = lists.map((l) => l.id).join(",");
  useEffect(() => {
    if (!userId || !listIds) return;
    const stops = listIds.split(",").map((listId) =>
      subscribeToItems(listId, userId, (items, changes) => {
        queryClient.setQueryData(["items", listId], items);
        changes.forEach((change) => notify(change));
      }),
    );
    return () => stops.forEach((stop) => stop());
  }, [userId, listIds, queryClient]);
}
