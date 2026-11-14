import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import ListButton from "@/components/ListButton";
import ListRow from "@/components/ListRow";
import "@/i18n";

// The theme reads the logged-in user's setting; nobody is logged in here.
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));

const list = { id: "l1", name: "ICA", groupId: "g", ownerId: "anna" };

describe("ListRow", () => {
  it("shows how many items there are and how many are new", () => {
    render(<ListRow list={list} count={{ total: 12, unseen: 3 }} onPress={() => {}} />);
    expect(screen.getByText("12 items")).toBeTruthy();
    expect(screen.getByText("3 new")).toBeTruthy();
    expect(screen.getByRole("button", { name: "ICA, 12 items, 3 new" })).toBeTruthy();
  });

  it("shows no pill when nothing is new, and says one item", () => {
    render(<ListRow list={list} count={{ total: 1, unseen: 0 }} onPress={() => {}} />);
    expect(screen.getByText("1 item")).toBeTruthy();
    expect(screen.queryByText(/new/)).toBeNull();
  });

  it("shows no count before the items have loaded", () => {
    render(<ListRow list={list} onPress={() => {}} />);
    expect(screen.queryByText(/item/)).toBeNull();
  });
});

describe("ListButton", () => {
  it("has a dot, read out too, when another list has new items", () => {
    const { rerender } = render(<ListButton list={list} onPress={() => {}} />);
    expect(screen.queryByTestId("new-elsewhere")).toBeNull();
    rerender(<ListButton list={list} hasNewElsewhere onPress={() => {}} />);
    expect(screen.getByTestId("new-elsewhere")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lists, new items in other lists" })).toBeTruthy();
  });
});
