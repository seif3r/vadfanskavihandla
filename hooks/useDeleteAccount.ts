import { useMutation } from "@tanstack/react-query";

import { ApiError } from "@/api/ApiError";
import { deleteAccount } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";

// Deletes the logged-in user's account, then logs out locally (clearing the cache), which shows
// the login screen.
export function useDeleteAccount() {
  const { logout } = useAuth();
  return useMutation<void, ApiError, string>({
    mutationFn: deleteAccount,
    onSuccess: () => logout(),
  });
}
