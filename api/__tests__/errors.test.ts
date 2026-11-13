import { describe, expect, it, jest } from "@jest/globals";

import { ApiError } from "@/api/ApiError";
import { toApiError, withApiError } from "@/api/errors";

describe("toApiError", () => {
  it.each([
    ["auth/invalid-credential", "errors.invalidCredentials"],
    ["auth/invalid-email", "errors.invalidEmail"],
    ["auth/user-disabled", "errors.accountDisabled"],
    ["auth/email-already-in-use", "errors.emailInUse"],
    ["auth/weak-password", "errors.weakPassword"],
    ["auth/too-many-requests", "errors.tooManyAttempts"],
    ["auth/network-request-failed", "errors.offline"],
    ["auth/user-token-expired", "errors.sessionExpired"],
    ["permission-denied", "errors.notAllowed"],
    ["unavailable", "errors.offline"],
    ["deadline-exceeded", "errors.offline"],
    ["unauthenticated", "errors.sessionExpired"],
    ["not-found", "errors.notFound"],
    ["functions/invalid-argument", "errors.inviteNotFound"],
    ["functions/failed-precondition", "errors.inviteExpired"],
    ["functions/permission-denied", "errors.removedFromGroup"],
    ["functions/unavailable", "errors.offline"],
    ["functions/deadline-exceeded", "errors.offline"],
    ["functions/unauthenticated", "errors.sessionExpired"],
    ["functions/not-found", "errors.notFound"],
  ])("maps %s to %s", (code, key) => {
    expect(toApiError({ code }).key).toBe(key);
  });

  it("falls back to unknown for codes it doesn't know, and for errors without one", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(toApiError({ code: "resource-exhausted" }).key).toBe("errors.unknown");
    expect(toApiError(new Error("boom")).key).toBe("errors.unknown");
    warn.mockRestore();
  });

  it("passes an ApiError through unchanged", () => {
    const error = new ApiError("errors.lastMember");
    expect(toApiError(error)).toBe(error);
  });
});

describe("withApiError", () => {
  it("returns the result", async () => {
    await expect(withApiError(() => Promise.resolve(42))).resolves.toBe(42);
  });

  it("turns a Firebase error into an ApiError", async () => {
    const error = await withApiError(() => Promise.reject({ code: "permission-denied" })).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).key).toBe("errors.notAllowed");
  });
});
