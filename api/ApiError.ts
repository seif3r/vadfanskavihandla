import { ErrorKey } from "@/types/errors";

// Thrown by the API. Carries a translation key instead of a finished sentence,
// so the screen showing the error can translate it into the current language.
export class ApiError extends Error {
  constructor(public key: ErrorKey) {
    super(key);
    this.name = "ApiError";
  }
}
