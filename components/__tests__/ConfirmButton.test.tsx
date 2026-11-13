import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import ConfirmButton from "@/components/ConfirmButton";

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));

describe("ConfirmButton", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("asks first and confirms on the second tap", () => {
    const onConfirm = jest.fn();
    render(<ConfirmButton label="Delete" confirmLabel="Delete?" onConfirm={onConfirm} />);
    fireEvent.press(screen.getByText("Delete"));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText("Delete?"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("goes back to the plain label if the second tap doesn't come", () => {
    const onConfirm = jest.fn();
    render(<ConfirmButton label="Delete" confirmLabel="Delete?" onConfirm={onConfirm} />);
    fireEvent.press(screen.getByText("Delete"));
    act(() => { jest.advanceTimersByTime(3000); });
    fireEvent.press(screen.getByText("Delete"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const onConfirm = jest.fn();
    render(<ConfirmButton label="Delete" confirmLabel="Delete?" onConfirm={onConfirm} disabled />);
    fireEvent.press(screen.getByText("Delete"));
    expect(screen.queryByText("Delete?")).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
