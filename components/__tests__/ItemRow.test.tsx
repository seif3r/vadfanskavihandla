import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import ItemRow from "@/components/ItemRow";
import "@/i18n";
import { Item } from "@/types/models";

// The theme reads the logged-in user's setting; nobody is logged in here.
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));

const item: Item = { id: "1", listId: "l", name: "Mjölk", done: false, addedBy: "u", amount: "2 l", category: "dairy" };

describe("ItemRow", () => {
  it("shows the name, amount and translated category", () => {
    render(<ItemRow item={item} onToggle={() => {}} />);
    expect(screen.getByText("Mjölk", { exact: false })).toBeTruthy();
    expect(screen.getByText("· 2 l", { exact: false })).toBeTruthy();
    expect(screen.getByText("Dairy", { exact: false })).toBeTruthy();
  });

  it("is a checkbox that reflects done", () => {
    const { rerender } = render(<ItemRow item={item} onToggle={() => {}} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    rerender(<ItemRow item={{ ...item, done: true }} onToggle={() => {}} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onToggle when tapped", () => {
    const onToggle = jest.fn();
    render(<ItemRow item={item} onToggle={onToggle} />);
    fireEvent.press(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
