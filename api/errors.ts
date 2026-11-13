import { ApiError } from "@/api/ApiError";

// Every exported function in api/ throws ApiError, never a raw Firebase error, so screens can always
// show t(error.key). Functions wrap their Firebase calls in withApiError (or catch and call toApiError).

// Maps Firebase error codes to the app's translated error keys.
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  switch ((error as { code?: string }).code) {
    case "auth/invalid-credential":
      return new ApiError("errors.invalidCredentials");
    // Only thrown for an address that can't be one (login and register), never for a wrong one.
    case "auth/invalid-email":
      return new ApiError("errors.invalidEmail");
    case "auth/user-disabled":
      return new ApiError("errors.accountDisabled");
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
    case "deadline-exceeded":
    case "functions/unavailable":
    case "functions/deadline-exceeded":
    case "auth/network-request-failed":
      return new ApiError("errors.offline");
    // The session ended elsewhere (password changed, account disabled) or its token can't be refreshed.
    case "unauthenticated":
    case "functions/unauthenticated":
    case "auth/user-token-expired":
      return new ApiError("errors.sessionExpired");
    case "not-found":
    case "functions/not-found":
      return new ApiError("errors.notFound");
    default:
      // The raw code is what's needed to add a case above.
      if (__DEV__) console.warn("Unmapped error", error);
      return new ApiError("errors.unknown");
  }
}

// Runs a Firebase call and turns its errors into ApiErrors.
export async function withApiError<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toApiError(error);
  }
}

// For live listeners: whether an error is worth showing. permission-denied is expected (a list was
// deleted, I left a group, I'm logging out) and the listener that got it is stopped anyway.
export function isListenerFailure(error: unknown): boolean {
  return (error as { code?: string }).code !== "permission-denied";
}
