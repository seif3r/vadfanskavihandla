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
const mockUpdateItem = jest.fn<(...args: unknown[]) => Promise<void>>();
let mockItems: Item[] = [];

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "anna" } }) }));
jest.mock("@/api/items", () => ({
  getItems: () => Promise.resolve(mockItems),
  updateItem: (...args: unknown[]) => mockUpdateItem(...args),
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
    mockUpdateItem.mockReset().mockResolvedValue(undefined);
    mockItems = [];
  });

  describe("editing", () => {
    const edit = { itemId: "i1", name: "Fil", amount: "2 l", category: "dairy" as const };

    beforeEach(() => {
      mockItems = [{ ...milk, amount: "1 l", category: "dairy" }];
    });

    it("shows the edit right away and saves it for the list", async () => {
      let finish = () => {};
      mockUpdateItem.mockReturnValueOnce(new Promise<void>((resolve) => { finish = resolve; }));
      const { result } = await setup();
      act(() => result.current.editItem(edit));
      await waitFor(() => expect(result.current.items[0]).toMatchObject({ name: "Fil", amount: "2 l" }));
      expect(mockUpdateItem).toHaveBeenCalledWith({ ...edit, listId: "l1" }, "anna");
      await act(async () => finish());
    });

    it("can take the amount away", async () => {
      const { result } = await setup();
      act(() => result.current.editItem({ itemId: "i1", name: "mjölk" }));
      await waitFor(() => expect(result.current.items[0].amount).toBeUndefined());
      expect(result.current.items[0].category).toBeUndefined();
    });

    it("puts the item back and reports the error when the save fails", async () => {
      mockUpdateItem.mockRejectedValueOnce(new ApiError("errors.notAllowed"));
      const { result } = await setup();
      act(() => result.current.editItem(edit));
      await waitFor(() => expect(result.current.error?.key).toBe("errors.notAllowed"));
      expect(result.current.items[0]).toMatchObject({ name: "mjölk", amount: "1 l" });
    });
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
