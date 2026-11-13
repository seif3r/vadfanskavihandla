import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { ReactNode } from "react";

import { ApiError } from "@/api/ApiError";
import { LIVE_RETRY_MS, useLiveUpdates } from "@/hooks/useLiveUpdates";
import "@/i18n";

type Listener = { onChange: (...args: unknown[]) => void; onError?: (error: ApiError) => void };
const mockGroupListeners: Listener[] = [];
const mockItemListeners: Listener[] = [];

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "anna", settings: { notifications: { itemAdded: false, itemRemoved: false } } } }),
}));
jest.mock("@/hooks/useLists", () => ({ useLists: () => ({ lists: [{ id: "l1", name: "ICA", groupId: "g1" }] }) }));
jest.mock("@/api/users", () => ({ getUsers: () => new Promise(() => {}) }));
jest.mock("@/api/groups", () => ({
  subscribeToGroups: (_userId: string, onChange: Listener["onChange"], onError: Listener["onError"]) => {
    mockGroupListeners.push({ onChange, onError });
    return () => {};
  },
}));
jest.mock("@/api/lists", () => ({ subscribeToLists: () => () => {} }));
jest.mock("@/api/items", () => ({
  subscribeToItems: (_listId: string, _userId: string, onChange: Listener["onChange"], onError: Listener["onError"]) => {
    mockItemListeners.push({ onChange, onError });
    return () => {};
  },
}));
jest.mock("@/helpers/notifications", () => ({ canReceivePush: false, showNotification: jest.fn() }));

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useLiveUpdates(), { wrapper });
}

describe("useLiveUpdates", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockGroupListeners.length = 0;
    mockItemListeners.length = 0;
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("reports nothing while every listener works", () => {
    const { result } = setup();
    expect(result.current).toBeNull();
  });

  it("reports a failed listener, starts the listeners again later, and clears it once data comes", () => {
    const { result } = setup();
    expect(mockItemListeners).toHaveLength(1);
    act(() => mockItemListeners[0].onError?.(new ApiError("errors.unknown")));
    expect(result.current?.key).toBe("errors.unknown");

    act(() => { jest.advanceTimersByTime(LIVE_RETRY_MS); });
    expect(mockItemListeners).toHaveLength(2);
    expect(mockGroupListeners).toHaveLength(2);

    act(() => mockItemListeners[1].onChange([], []));
    expect(result.current).toBeNull();
    // Working again: no more restarts.
    act(() => { jest.advanceTimersByTime(LIVE_RETRY_MS * 2); });
    expect(mockItemListeners).toHaveLength(2);
  });

  it("keeps trying while a listener keeps failing", () => {
    const { result } = setup();
    act(() => mockGroupListeners[0].onError?.(new ApiError("errors.offline")));
    act(() => { jest.advanceTimersByTime(LIVE_RETRY_MS); });
    act(() => mockGroupListeners[1].onError?.(new ApiError("errors.offline")));
    act(() => { jest.advanceTimersByTime(LIVE_RETRY_MS); });
    expect(mockGroupListeners).toHaveLength(3);
    expect(result.current?.key).toBe("errors.offline");
  });
});
