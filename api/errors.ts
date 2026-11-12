import { ApiError } from "@/api/ApiError";

// Maps Firebase error codes to the app's translated error keys.
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  switch ((error as { code?: string }).code) {
    case "auth/invalid-credential":
    case "auth/invalid-email":
      return new ApiError("errors.invalidCredentials");
    case "auth/email-already-in-use":
      return new ApiError("errors.emailInUse");
    case "auth/weak-password":
      return new ApiError("errors.weakPassword");
    case "auth/too-many-requests":
      return new ApiError("errors.tooManyAttempts");
    case "permission-denied":
      return new ApiError("errors.notAllowed");
    // From the joinGroup Cloud Function.
    case "functions/invalid-argument":
      return new ApiError("errors.inviteNotFound");
    case "functions/failed-precondition":
      return new ApiError("errors.inviteExpired");
    case "functions/permission-denied":
      return new ApiError("errors.removedFromGroup");
    case "unavailable":
    case "functions/unavailable":
    case "auth/network-request-failed":
      return new ApiError("errors.offline");
    default:
      return new ApiError("errors.unknown");
  }
}