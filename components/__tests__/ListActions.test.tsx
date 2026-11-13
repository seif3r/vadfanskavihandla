import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import ListActions from "@/components/ListActions";
import "@/i18n";
import { Item } from "@/types/models";

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));

const item = (id: string, done: boolean): Item => ({ id, listId: "l1", name: id, done, addedBy: "anna" });

describe("ListActions", () => {
  it("asks before removing the checked items", () => {
    const onRemoveChecked = jest.fn();
    render(
      <ListActions items={[item("a", true)]} onCheckAll={jest.fn()} onUncheckAll={jest.fn()} onRemoveChecked={onRemoveChecked} />,
    );
    fireEvent.press(screen.getByText("Remove"));
    expect(onRemoveChecked).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText("Remove checked?"));
    expect(onRemoveChecked).toHaveBeenCalledTimes(1);
  });

  it("can't remove when nothing is checked", () => {
    const onRemoveChecked = jest.fn();
    render(
      <ListActions items={[item("a", false)]} onCheckAll={jest.fn()} onUncheckAll={jest.fn()} onRemoveChecked={onRemoveChecked} />,
    );
    fireEvent.press(screen.getByText("Remove"));
    expect(screen.queryByText("Remove checked?")).toBeNull();
  });
});
