import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { getActivity } from "@/api/activity";
import { getUsers } from "@/api/users";
import { startMockActivity } from "@/mock/activitySimulator";
import { useAuth } from "@/context/AuthContext";
import { useLists } from "@/context/ListsContext";
import { showNotification } from "@/helpers/notifications";

const POLL_INTERVAL_MS = 10_000;

// Watches what happens to the lists. The other user's changes refresh the affected lists, and
// become notifications if the user has turned them on in Settings.
// Mount once, while logged in.
export function useActivityNotifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { lists } = useLists();
  const queryClient = useQueryClient();
  const isLoggedIn = !!user;
  // Newest event already handled. null = nothing fetched yet since logging in.
  const seenId = useRef<number | null>(null);

  useEffect(() => {
    seenId.current = null;
  }, [isLoggedIn]);

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: isLoggedIn,
  });

  const { data: events } = useQuery({
    queryKey: ["activity"],
    queryFn: () => getActivity(seenId.current ?? 0),
    enabled: isLoggedIn,
    refetchInterval: POLL_INTERVAL_MS,
  });

  useEffect(() => {
    if (!events) return;
    // The first fetch is history from before the app opened: remember where it ends, don't notify.
    if (seenId.current === null) {
      seenId.current = events.at(-1)?.id ?? 0;
      return;
    }
    const fresh = events.filter((e) => e.id > seenId.current!);
    if (fresh.length === 0) return;
    seenId.current = fresh.at(-1)!.id;

    const fromOthers = fresh.filter((e) => e.userId !== user?.id);
    new Set(fromOthers.map((e) => e.listId)).forEach((listId) =>
      queryClient.invalidateQueries({ queryKey: ["items", listId] }),
    );

    for (const event of fromOthers) {
      if (!user?.settings.notifications[event.type]) continue;
      const who = users?.find((u) => u.id === event.userId)?.name ?? "";
      const listName = lists.find((l) => l.id === event.listId)?.name ?? "";
      showNotification(listName, t(`notifications.${event.type}`, { user: who, item: event.itemName }));
    }
  }, [events, user, users, lists, t, queryClient]);

  // DEV ONLY: a simulated second user, so there is something to be notified about.
  const userId = user?.id;
  useEffect(() => {
    if (!__DEV__ || !userId) return;
    return startMockActivity(userId);
  }, [userId]);
}
