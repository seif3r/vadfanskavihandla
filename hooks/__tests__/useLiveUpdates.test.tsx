import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { ReactNode } from "react";

import { ApiError } from "@/api/ApiError";
import { NOTIFICATION_DELAY_SECONDS } from "@/constants/limits";
import { showNotification } from "@/helpers/notifications";
import { LIVE_RETRY_MS, useLiveUpdates } from "@/hooks/useLiveUpdates";
import i18n from "@/i18n";

type Listener = { onChange: (...args: unknown[]) => void; onError?: (error: ApiError) => void };
const mockGroupListeners: Listener[] = [];
const mockItemListeners: Listener[] = [];

// Notifications off unless a test turns them on.
const mockNotifications = { itemAdded: false, itemRemoved: false };
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "anna", settings: { notifications: mockNotifications } } }),
}));
jest.mock("@/hooks/useLists", () => ({ useLists: () => ({ lists: [{ id: "l1", name: "ICA", groupId: "g1" }] }) }));
jest.mock("@/api/users", () => ({ getUsers: async () => [{ id: "bob", name: "Bob" }] }));
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
    mockNotifications.itemAdded = false;
    mockNotifications.itemRemoved = false;
    jest.mocked(showNotification).mockClear();
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

  describe("notifications", () => {
    const change = (type: string, id: string, name: string) =>
      ({ type, item: { id, name, listId: "l1", done: false }, userId: "bob" });
    const added = (id: string, name: string) => change("itemAdded", id, name);
    const removed = (id: string, name: string) => change("itemRemoved", id, name);
    const delay = NOTIFICATION_DELAY_SECONDS.itemAdded * 1000;
    const wait = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });

    beforeEach(async () => {
      mockNotifications.itemAdded = true;
      mockNotifications.itemRemoved = true;
      await i18n.changeLanguage("en");
    });

    it("bundles someone's adds into one notification that names no items", async () => {
      setup();
      // Lets the members query resolve, so Bob has a name.
      await act(async () => {});
      act(() => mockItemListeners[0].onChange([], [added("i1", "Mjölk"), added("i2", "Bröd")]));
      act(() => { jest.advanceTimersByTime(delay); });

      expect(showNotification).toHaveBeenCalledTimes(1);
      expect(showNotification).toHaveBeenCalledWith("ICA", "Bob added items");
    });

    it("says one item without naming it, same as the push", async () => {
      setup();
      await act(async () => {});
      act(() => mockItemListeners[0].onChange([], [added("i1", "Mjölk"), added("i1", "Mjölk")]));
      act(() => { jest.advanceTimersByTime(delay); });

      expect(showNotification).toHaveBeenCalledWith("ICA", "Bob added an item");
    });

    it("waits two minutes after the last add", async () => {
      setup();
      await act(async () => {});
      act(() => mockItemListeners[0].onChange([], [added("i1", "Mjölk")]));
      wait(119_000);
      // Another add restarts the wait.
      act(() => mockItemListeners[0].onChange([], [added("i2", "Bröd")]));
      wait(119_000);
      expect(showNotification).not.toHaveBeenCalled();
      wait(1_000);
      expect(showNotification).toHaveBeenCalledWith("ICA", "Bob added items");
    });

    it("waits five minutes for removals, without holding up adds", async () => {
      setup();
      await act(async () => {});
      act(() => mockItemListeners[0].onChange([], [removed("i1", "Mjölk"), added("i2", "Bröd")]));
      wait(120_000);
      expect(showNotification).toHaveBeenCalledTimes(1);
      expect(showNotification).toHaveBeenLastCalledWith("ICA", "Bob added an item");
      wait(179_000);
      expect(showNotification).toHaveBeenCalledTimes(1);
      wait(1_000);
      expect(showNotification).toHaveBeenLastCalledWith("ICA", "Bob removed an item");
    });
  });
});
