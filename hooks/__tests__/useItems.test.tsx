import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { ReactNode } from "react";

import { ApiError } from "@/api/ApiError";
import { useItems } from "@/hooks/useItems";
import { Item } from "@/types/models";

const mockAddItem = jest.fn<(...args: unknown[]) => Promise<Item>>();
const mockToggleItem = jest.fn<(...args: unknown[]) => Promise<Item>>();
const mockRemoveDone = jest.fn<(...args: unknown[]) => Promise<void>>();

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "anna" } }) }));
jest.mock("@/api/items", () => ({
  getItems: () => Promise.resolve([]),
  addItem: (...args: unknown[]) => mockAddItem(...args),
  toggleItem: (...args: unknown[]) => mockToggleItem(...args),
  setAllDone: () => Promise.resolve([]),
  removeDone: (...args: unknown[]) => mockRemoveDone(...args),
}));

const milk: Item = { id: "i1", listId: "l1", name: "mjölk", done: false, addedBy: "anna" };

// No garbage-collection timers, so nothing is left running when a test ends.
async function setup(listId = "l1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook((props: { listId: string }) => useItems(props.listId), { wrapper, initialProps: { listId } });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe("useItems", () => {
  beforeEach(() => {
    mockAddItem.mockReset().mockResolvedValue(milk);
    mockToggleItem.mockReset().mockResolvedValue(milk);
    mockRemoveDone.mockReset().mockResolvedValue(undefined);
  });

  it("reports a failed add and calls back so the screen can restore the text", async () => {
    mockAddItem.mockRejectedValueOnce(new ApiError("errors.notAllowed"));
    const onFailed = jest.fn();
    const { result } = await setup();
    act(() => result.current.addItem({ name: "mjölk" }, onFailed));
    await waitFor(() => expect(result.current.error?.key).toBe("errors.notAllowed"));
    expect(onFailed).toHaveBeenCalled();
  });

  it("reports failed toggles and removals", async () => {
    mockToggleItem.mockRejectedValueOnce(new ApiError("errors.offline"));
    const { result } = await setup();
    act(() => result.current.toggleItem("i1"));
    await waitFor(() => expect(result.current.error?.key).toBe("errors.offline"));

    mockRemoveDone.mockRejectedValueOnce(new ApiError("errors.notAllowed"));
    act(() => result.current.removeChecked());
    await waitFor(() => expect(result.current.error?.key).toBe("errors.notAllowed"));
  });

  it("clears the error when the next change starts", async () => {
    mockAddItem.mockRejectedValueOnce(new ApiError("errors.notAllowed"));
    const { result } = await setup();
    act(() => result.current.addItem({ name: "mjölk" }));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => result.current.addItem({ name: "bröd" }));
    await waitFor(() => expect(result.current.error).toBeNull());
  });

  it("doesn't show one list's error on another", async () => {
    mockAddItem.mockRejectedValueOnce(new ApiError("errors.notAllowed"));
    const { result, rerender } = await setup("l1");
    act(() => result.current.addItem({ name: "mjölk" }));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    rerender({ listId: "l2" });
    expect(result.current.error).toBeNull();
  });
});
