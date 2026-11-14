import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { ReactNode } from "react";
import { AppState } from "react-native";

import { SEEN_SAVE_DELAY_MS, useListCounts, useMarkSeen } from "@/hooks/useSeen";
import { Item, SeenState } from "@/types/models";

const mockSaveSeen = jest.fn<(userId: string, listId: string, ids: string[]) => Promise<void>>();

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "anna" } }) }));
jest.mock("@/api/seen", () => ({
  getSeen: () => new Promise(() => {}),
  saveSeen: (userId: string, listId: string, ids: string[]) => mockSaveSeen(userId, listId, ids),
}));
jest.mock("@/api/items", () => ({ getItems: () => new Promise(() => {}) }));

const item = (id: string, addedBy = "bob", createdAt = 200): Item =>
  ({ id, listId: "l1", name: id, done: false, addedBy, createdAt });
const seen = (listId: string, itemIds: string[] = []): SeenState => ({ listId, since: 100, itemIds });

function client() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  queryClient.setQueryData(["seen"], { l1: seen("l1", ["already"]), l2: seen("l2") });
  queryClient.setQueryData(["items", "l1"], [item("a"), item("b"), item("mine", "anna"), item("already")]);
  queryClient.setQueryData(["items", "l2"], [item("x")]);
  return queryClient;
}
const wrapperFor = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };

describe("useMarkSeen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSaveSeen.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const setup = (listId = "l1") => {
    const queryClient = client();
    const hook = renderHook((props: { listId: string }) => useMarkSeen(props.listId), {
      wrapper: wrapperFor(queryClient), initialProps: { listId },
    });
    return hook;
  };

  it("saves what was on screen once, after a moment, with the ids already seen", () => {
    const { result } = setup();
    act(() => result.current(["a"]));
    act(() => result.current(["a", "b"]));
    expect(mockSaveSeen).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(SEEN_SAVE_DELAY_MS); });
    expect(mockSaveSeen).toHaveBeenCalledTimes(1);
    expect(mockSaveSeen).toHaveBeenCalledWith("anna", "l1", ["already", "a", "b"]);
  });

  it("saves nothing when nothing new was on screen", () => {
    const { result } = setup();
    act(() => result.current(["mine", "already", "not-on-list"]));
    act(() => { jest.advanceTimersByTime(SEEN_SAVE_DELAY_MS); });
    expect(mockSaveSeen).not.toHaveBeenCalled();
  });

  it("saves right away when another list is opened or the screen closes", () => {
    const { result, rerender, unmount } = setup();
    act(() => result.current(["a"]));
    rerender({ listId: "l2" });
    expect(mockSaveSeen).toHaveBeenCalledWith("anna", "l1", ["already", "a"]);
    act(() => result.current(["x"]));
    unmount();
    expect(mockSaveSeen).toHaveBeenCalledWith("anna", "l2", ["x"]);
  });

  it("ignores rows laid out while the app is in the background", () => {
    // React Native's Jest setup makes currentState a mock function; the app reads a string.
    const original = Object.getOwnPropertyDescriptor(AppState, "currentState")!;
    Object.defineProperty(AppState, "currentState", { value: "background", configurable: true });
    const { result } = setup();
    act(() => result.current(["a"]));
    act(() => { jest.advanceTimersByTime(SEEN_SAVE_DELAY_MS); });
    expect(mockSaveSeen).not.toHaveBeenCalled();
    Object.defineProperty(AppState, "currentState", original);
  });
});

describe("useListCounts", () => {
  it("counts every item and the ones new to me, per list", async () => {
    const lists = ["l1", "l2", "notLoaded"].map((id) => ({ id, name: id, groupId: "g", ownerId: "anna" }));
    const { result } = renderHook(() => useListCounts(lists), { wrapper: wrapperFor(client()) });
    await waitFor(() => expect(result.current).toEqual({
      l1: { total: 4, unseen: 2 },
      l2: { total: 1, unseen: 1 },
    }));
  });
});
