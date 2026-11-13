import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/ApiError";
import { loadCurrentUser } from "@/api/auth";
import { updateSettings } from "@/api/settings";
import { UpdateSettingsRequest } from "@/types/api";
import { User, UserSettings } from "@/types/models";

export const userKey = ["user"];

// The logged-in user's profile and settings. Only fetched once AuthContext knows Firebase has a
// session. Settings changes write the saved result straight into the cache.
export function useCurrentUser(hasSession: boolean) {
  const queryClient = useQueryClient();

  const userQuery = useQuery<User, ApiError>({
    queryKey: userKey,
    queryFn: loadCurrentUser,
    enabled: hasSession,
    // Only this device changes the user (login, settings), and both write to the cache.
    staleTime: Infinity,
    // AuthContext decides what a failure means (logged out, or offline and worth a retry), so it
    // should know at once rather than after the default retries.
    retry: false,
  });

  const settingsMutation = useMutation({
    mutationFn: ({ userId, settings }: UpdateSettingsRequest) => updateSettings(userId, settings),
    onSuccess: (saved) => queryClient.setQueryData<User>(userKey, saved),
  });

  const user = userQuery.data ?? null;

  return {
    user,
    isLoading: hasSession && userQuery.isPending,
    error: userQuery.error,
    reload: () => userQuery.refetch(),
    updateSettings: async (settings: Partial<UserSettings>) => {
      if (user) await settingsMutation.mutateAsync({ userId: user.id, settings });
    },
  };
}
