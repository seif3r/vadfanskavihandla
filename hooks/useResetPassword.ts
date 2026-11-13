import { useMutation } from "@tanstack/react-query";

import { ApiError } from "@/api/ApiError";
import { resetPassword } from "@/api/auth";
import { ResetPasswordRequest } from "@/types/api";

// Sends a password reset email, for someone who isn't logged in. Nothing is cached.
export function useResetPassword() {
  return useMutation<void, ApiError, ResetPasswordRequest>({
    mutationFn: ({ email, language }) => resetPassword(email, language),
  });
}
