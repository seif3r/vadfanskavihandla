import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent } from "react";
import { useTranslation } from "react-i18next";

import { subscribeToItems } from "@/api/items";
import { subscribeToLists } from "@/api/lists";
import { getUsers } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { useLists } from "@/context/ListsContext";
import { canReceivePush, showNotification } from "@/helpers/notifications";
import { ItemChange } from "@/types/models";

// Keeps lists and items live for every list the user is in, and turns other people's
// changes into notifications if the user has turned them on. Mount once.
// Installed builds get those as push notifications from the server instead, so they aren't shown twice.
export function useLiveUpdates() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { lists } = useLists();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: members } = useQuery({ queryKey: ["users"], queryFn: getUsers, enabled: !!userId });

  // Reads the latest settings, names and translations without re-subscribing.
  const notify = useEffectEvent((change: ItemChange) => {
    if (canReceivePush || !user?.settings.notifications[change.type]) return;
    // Someone who just joined isn't in the cached members yet.
    if (!members?.some((m) => m.id === change.userId)) queryClient.invalidateQueries({ queryKey: ["users"] });
    const who = members?.find((m) => m.id === change.userId)?.name ?? "";
    const listName = lists.find((l) => l.id === change.item.listId)?.name ?? "";
    showNotification(listName, t(`notifications.${change.type}`, { user: who, item: change.item.name }));
  });

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
