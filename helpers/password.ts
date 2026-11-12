import { MIN_PASSWORD_LENGTH } from "@/constants/limits";
import { PasswordProblem } from "@/types/api";

// Checks the change password form before anything is sent, so simple mistakes get a clear
// message without a round trip. Returns the first problem, or null if the form can be sent.
// Passwords are compared as typed: spaces are allowed in them and are not trimmed.
export function checkNewPassword(current: string, next: string, repeated: string): PasswordProblem | null {
  if (!current || !next || !repeated) return "fillAll";
  if (next.length < MIN_PASSWORD_LENGTH) return "tooShort";
  if (next !== repeated) return "mismatch";
  if (next === current) return "sameAsCurrent";
  return null;
}
