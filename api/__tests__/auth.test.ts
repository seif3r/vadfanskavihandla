import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { ApiError } from "@/api/ApiError";
import { changePassword, deleteAccount, login, register, resetPassword } from "@/api/auth";

const mockUser: { email: string | null } = { email: "anna@example.com" };
const mockReauthenticate = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockUpdatePassword = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockNewUser = { uid: "anna" };
const mockCreateUser = jest.fn<(...args: unknown[]) => Promise<{ user: typeof mockNewUser }>>();
const mockSignIn = jest.fn<(...args: unknown[]) => Promise<{ user: typeof mockNewUser }>>();
const mockDeleteUser = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockSignOut = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockCommit = jest.fn<() => Promise<void>>();
const mockSendReset = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockCallDeleteAccount = jest.fn<() => Promise<unknown>>();
const mockGetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();

// Only the parts of Firebase changePassword touches; the real SDK would need a project.
jest.mock("@/api/firebase", () => ({
  ...jest.requireActual<typeof import("@/api/errors")>("@/api/errors"),
  db: {},
  functions: {},
  auth: { authStateReady: () => Promise.resolve(), get currentUser() { return mockUser; }, languageCode: null },
}));
jest.mock("firebase/auth", () => ({
  EmailAuthProvider: { credential: (email: string, password: string) => ({ email, password }) },
  reauthenticateWithCredential: (...args: unknown[]) => mockReauthenticate(...args),
  updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUser(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignIn(...args),
  deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  sendPasswordResetEmail: (...args: unknown[]) => mockSendReset(...args),
}));
jest.mock("firebase/functions", () => ({
  httpsCallable: (_functions: unknown, name: string) => {
    if (name !== "deleteAccount") throw new Error(`Unexpected function ${name}`);
    return () => mockCallDeleteAccount();
  },
}));
jest.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  writeBatch: () => ({ set: () => {}, commit: () => mockCommit() }),
}));

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

describe("register", () => {
  beforeEach(() => {
    mockCreateUser.mockReset().mockResolvedValue({ user: mockNewUser });
    mockCommit.mockReset().mockResolvedValue(undefined);
    mockDeleteUser.mockReset().mockResolvedValue(undefined);
    mockSignOut.mockReset().mockResolvedValue(undefined);
  });

  it("creates the account and its documents", async () => {
    const user = await register("Anna", " anna@example.com ", "hemligt1");
    expect(user).toMatchObject({ id: "anna", name: "Anna", email: "anna@example.com" });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("removes the new account if its documents can't be saved", async () => {
    mockCommit.mockRejectedValueOnce({ code: "unavailable" });
    expect(await errorKey(register("Anna", "anna@example.com", "hemligt1"))).toBe("errors.offline");
    expect(mockDeleteUser).toHaveBeenCalledWith(mockNewUser);
  });

  it("signs out if the half-made account can't be removed either", async () => {
    mockCommit.mockRejectedValueOnce({ code: "unavailable" });
    mockDeleteUser.mockRejectedValueOnce({ code: "auth/network-request-failed" });
    expect(await errorKey(register("Anna", "anna@example.com", "hemligt1"))).toBe("errors.offline");
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("doesn't remove anything when the account itself can't be created", async () => {
    mockCreateUser.mockRejectedValueOnce({ code: "auth/email-already-in-use" });
    expect(await errorKey(register("Anna", "anna@example.com", "hemligt1"))).toBe("errors.emailInUse");
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});

describe("login", () => {
  beforeEach(() => {
    mockSignIn.mockReset().mockResolvedValue({ user: mockNewUser });
    mockGetDoc.mockReset();
    mockDeleteUser.mockReset().mockResolvedValue(undefined);
  });

  it("loads the user", async () => {
    mockGetDoc.mockResolvedValue({
      id: "anna",
      exists: () => true,
      data: () => ({ name: "Anna", email: "anna@example.com", settings: { language: "sv", theme: "system" } }),
    });
    expect(await login("anna@example.com", "hemligt1")).toMatchObject({ id: "anna", name: "Anna" });
  });

  it("removes an account whose registration never finished, so it can be made again", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    expect(await errorKey(login("anna@example.com", "hemligt1"))).toBe("errors.registrationIncomplete");
    expect(mockDeleteUser).toHaveBeenCalledWith(mockNewUser);
  });

  it("keeps the account when the user can't be loaded for another reason", async () => {
    mockGetDoc.mockRejectedValue({ code: "unavailable" });
    expect(await errorKey(login("anna@example.com", "hemligt1"))).toBe("errors.offline");
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});

describe("resetPassword", () => {
  beforeEach(() => {
    mockSendReset.mockReset().mockResolvedValue(undefined);
  });

  it("sends the email in the given language", async () => {
    await resetPassword(" anna@example.com ", "sv");
    expect(mockSendReset).toHaveBeenCalledWith(expect.objectContaining({ languageCode: "sv" }), "anna@example.com");
  });

  it("says when the address can't be one", async () => {
    mockSendReset.mockRejectedValueOnce({ code: "auth/invalid-email" });
    expect(await errorKey(resetPassword("anna", "sv"))).toBe("errors.invalidEmail");
  });
});

describe("deleteAccount", () => {
  beforeEach(() => {
    mockUser.email = "anna@example.com";
    mockReauthenticate.mockReset().mockResolvedValue(undefined);
    mockCallDeleteAccount.mockReset().mockResolvedValue({ data: null });
    mockSignOut.mockReset().mockResolvedValue(undefined);
  });

  it("checks the password, deletes the account and signs out", async () => {
    await deleteAccount("hemligt1");
    expect(mockReauthenticate).toHaveBeenCalledWith(mockUser, { email: "anna@example.com", password: "hemligt1" });
    expect(mockCallDeleteAccount).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("deletes nothing with the wrong password", async () => {
    mockReauthenticate.mockRejectedValueOnce({ code: "auth/invalid-credential" });
    expect(await errorKey(deleteAccount("fel"))).toBe("errors.wrongPassword");
    expect(mockCallDeleteAccount).not.toHaveBeenCalled();
  });

  it("stays logged in when the deletion fails, so it can be tried again", async () => {
    mockCallDeleteAccount.mockRejectedValueOnce({ code: "functions/unavailable" });
    expect(await errorKey(deleteAccount("hemligt1"))).toBe("errors.offline");
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
