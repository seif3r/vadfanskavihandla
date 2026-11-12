import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { ApiError } from "@/api/ApiError";
import { changePassword } from "@/api/auth";

const mockUser: { email: string | null } = { email: "anna@example.com" };
const mockReauthenticate = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockUpdatePassword = jest.fn<(...args: unknown[]) => Promise<void>>();

// Only the parts of Firebase changePassword touches; the real SDK would need a project.
jest.mock("@/api/firebase", () => ({
  toApiError: jest.requireActual<typeof import("@/api/errors")>("@/api/errors").toApiError,
  db: {},
  auth: { authStateReady: () => Promise.resolve(), get currentUser() { return mockUser; } },
}));
jest.mock("firebase/auth", () => ({
  EmailAuthProvider: { credential: (email: string, password: string) => ({ email, password }) },
  reauthenticateWithCredential: (...args: unknown[]) => mockReauthenticate(...args),
  updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
}));
// Used by login and register, not by changePassword.
jest.mock("firebase/firestore", () => ({}));

const errorKey = async (promise: Promise<unknown>) => {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return (error as ApiError).key;
};

describe("changePassword", () => {
  beforeEach(() => {
    mockUser.email = "anna@example.com";
    mockReauthenticate.mockReset().mockResolvedValue(undefined);
    mockUpdatePassword.mockReset().mockResolvedValue(undefined);
  });

  it("logs in again with the current password, then sets the new one", async () => {
    await changePassword("gammalt1", "nyttlösen");
    expect(mockReauthenticate).toHaveBeenCalledWith(mockUser, { email: "anna@example.com", password: "gammalt1" });
    expect(mockUpdatePassword).toHaveBeenCalledWith(mockUser, "nyttlösen");
  });

  it("says the password is wrong when the current one is rejected", async () => {
    for (const code of ["auth/invalid-credential", "auth/wrong-password"]) {
      mockReauthenticate.mockRejectedValueOnce({ code });
      expect(await errorKey(changePassword("fel", "nyttlösen"))).toBe("errors.wrongPassword");
    }
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("reports too many attempts", async () => {
    mockReauthenticate.mockRejectedValueOnce({ code: "auth/too-many-requests" });
    expect(await errorKey(changePassword("fel", "nyttlösen"))).toBe("errors.tooManyAttempts");
  });

  it("reports a new password Firebase finds too weak", async () => {
    mockUpdatePassword.mockRejectedValueOnce({ code: "auth/weak-password" });
    expect(await errorKey(changePassword("gammalt1", "123456"))).toBe("errors.weakPassword");
  });

  it("needs an account with an email", async () => {
    mockUser.email = null;
    expect(await errorKey(changePassword("gammalt1", "nyttlösen"))).toBe("errors.invalidSession");
    expect(mockReauthenticate).not.toHaveBeenCalled();
  });
});
