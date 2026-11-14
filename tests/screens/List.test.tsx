import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import Index from "@/app/index";
import "@/i18n";
import { Item } from "@/types/models";

const mockEditItem = jest.fn();
const mockAddItem = jest.fn();
let mockItems: Item[] = [];

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
jest.mock("@/context/LiveStatusContext", () => ({ useLiveStatus: () => null }));
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("expo-router/react-navigation", () => ({ useHeaderHeight: () => 0 }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock("@/hooks/useActiveList", () => ({
  useActiveList: () => ({ activeList: { id: "l1", name: "ICA", groupId: "g1", ownerId: "anna" }, isLoading: false }),
}));
jest.mock("@/hooks/useGroups", () => ({ useGroups: () => ({ groups: [] }) }));
jest.mock("@/hooks/useKnownItems", () => ({ useKnownItems: () => ({ categoryFor: () => undefined }) }));
jest.mock("@/hooks/useItems", () => ({
  useItems: () => ({
    items: mockItems,
    isLoading: false,
    addItem: mockAddItem,
    editItem: mockEditItem,
    toggleItem: jest.fn(),
    checkAll: jest.fn(),
    uncheckAll: jest.fn(),
    removeChecked: jest.fn(),
    error: null,
  }),
}));

jest.setTimeout(20000);

const milk: Item = { id: "i1", listId: "l1", name: "Mjölk", done: false, addedBy: "bob", amount: "1 l", category: "dairy" };
const input = () => screen.getByPlaceholderText("What do you need to buy?");

describe("List screen, editing an item", () => {
  beforeEach(() => {
    mockEditItem.mockReset();
    mockAddItem.mockReset();
    mockItems = [milk];
  });

  it("fills the input bar with the item and saves the change", () => {
    render(<Index />);
    fireEvent.press(screen.getByRole("button", { name: "Edit Mjölk" }));
    expect(input().props.value).toBe("Mjölk");
    expect(screen.getByDisplayValue("1 l")).toBeTruthy();
    expect(screen.getByText("Editing Mjölk")).toBeTruthy();

    fireEvent.changeText(input(), "Fil");
    fireEvent.press(screen.getByText("Save"));
    expect(mockEditItem).toHaveBeenCalledWith({ itemId: "i1", name: "Fil", amount: "1 l", category: "dairy" });
    expect(mockAddItem).not.toHaveBeenCalled();
    expect(screen.queryByText("Editing Mjölk")).toBeNull();
  });

  it("puts back what was being typed when the edit is cancelled", () => {
    render(<Index />);
    fireEvent.changeText(input(), "Bröd");
    fireEvent.press(screen.getByRole("button", { name: "Edit Mjölk" }));
    fireEvent.press(screen.getByText("Cancel"));
    expect(input().props.value).toBe("Bröd");
    expect(screen.getByText("Add")).toBeTruthy();
    expect(mockEditItem).not.toHaveBeenCalled();
  });

  it("stops editing when someone else removes the item", () => {
    const { rerender } = render(<Index />);
    fireEvent.press(screen.getByRole("button", { name: "Edit Mjölk" }));
    mockItems = [];
    rerender(<Index />);
    expect(screen.queryByText("Editing Mjölk")).toBeNull();
    expect(input().props.value).toBe("");
  });
});
