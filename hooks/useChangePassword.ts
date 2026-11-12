import { useMutation } from "@tanstack/react-query";

import { changePassword } from "@/api/auth";
import { ChangePasswordRequest } from "@/types/api";

// Changes the logged-in user's password. Nothing is cached, so there is nothing to update after.
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordRequest) =>
      changePassword(currentPassword, newPassword),
  });
}
