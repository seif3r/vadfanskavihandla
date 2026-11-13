import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import { ReactNode } from "react";

import { ApiError } from "@/api/ApiError";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { User } from "@/types/models";

const mockLoadCurrentUser = jest.fn<() => Promise<User>>();
const mockLogout = jest.fn<() => Promise<void>>();

jest.mock("@/api/auth", () => ({
  hasSession: () => Promise.resolve(true),
  loadCurrentUser: () => mockLoadCurrentUser(),
  logout: () => mockLogout(),
}));
jest.mock("@/api/settings", () => ({ updateSettings: jest.fn() }));
jest.mock("@/api/push", () => ({ removePushToken: jest.fn() }));
jest.mock("@/helpers/notifications", () => ({ getPushToken: () => Promise.resolve(null) }));

const anna: User = {
  id: "anna",
  name: "Anna",
  email: "anna@example.com",
  settings: { language: "sv", theme: "system", notifications: { itemAdded: false, itemRemoved: false } },
};

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useAuth(), { wrapper });
}

describe("AuthProvider", () => {
  beforeEach(() => {
    mockLoadCurrentUser.mockReset();
    mockLogout.mockReset().mockResolvedValue(undefined);
  });

  it("restores the logged-in user", async () => {
    mockLoadCurrentUser.mockResolvedValue(anna);
    const { result } = setup();
    await waitFor(() => expect(result.current.user?.id).toBe("anna"));
    expect(result.current.loadError).toBeNull();
  });

  it("keeps the session when the user can't be loaded offline, and can try again", async () => {
    mockLoadCurrentUser.mockRejectedValueOnce(new ApiError("errors.offline"));
    const { result } = setup();
    await waitFor(() => expect(result.current.loadError?.key).toBe("errors.offline"));
    expect(result.current.user).toBeNull();
    expect(mockLogout).not.toHaveBeenCalled();

    mockLoadCurrentUser.mockResolvedValue(anna);
    result.current.reload();
    await waitFor(() => expect(result.current.user?.id).toBe("anna"));
    expect(result.current.loadError).toBeNull();
  });

  it.each(["errors.invalidSession", "errors.sessionExpired"] as const)(
    "ends the session on %s, which shows the login screen",
    async (key) => {
      mockLoadCurrentUser.mockRejectedValueOnce(new ApiError(key));
      const { result } = setup();
      await waitFor(() => expect(mockLogout).toHaveBeenCalled());
      expect(result.current.user).toBeNull();
      expect(result.current.loadError).toBeNull();
      expect(result.current.isLoading).toBe(false);
    },
  );
});
