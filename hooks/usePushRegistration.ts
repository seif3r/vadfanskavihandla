import { useEffect } from "react";

import { savePushToken } from "@/api/push";
import { useAuth } from "@/context/AuthContext";
import { canReceivePush, getPushToken } from "@/helpers/notifications";

// Registers this device for push notifications while the user has at least one
// notification setting on. Runs again when a setting is switched on. Mount once.
export function usePushRegistration() {
  const { user } = useAuth();
  const userId = user?.id;
  const notifications = user?.settings.notifications;
  const wantsPush = !!notifications && (notifications.itemAdded || notifications.itemCompleted);

  useEffect(() => {
    if (!userId || !wantsPush || !canReceivePush) return;
    getPushToken()
      .then((token) => (token ? savePushToken(userId, token) : undefined))
      // Without a token the user simply gets no push; nothing to show.
      .catch(() => {});
  }, [userId, wantsPush]);
}
