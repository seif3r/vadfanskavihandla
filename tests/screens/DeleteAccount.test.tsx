import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { ApiError } from "@/api/ApiError";
import DeleteAccount from "@/app/delete-account";
import "@/i18n";

type MutateOptions = { onError?: (error: ApiError) => void };
const mockMutate = jest.fn<(password: string, options: MutateOptions) => void>();

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
jest.mock("@/hooks/useDeleteAccount", () => ({
  useDeleteAccount: () => ({ mutate: mockMutate, isPending: false }),
}));

// The first render loads React Native's components, which is slow on a cold CI runner.
jest.setTimeout(20000);

const confirmDelete = () => {
  fireEvent.press(screen.getByText("Delete account"));
  fireEvent.press(screen.getByText("Delete for good?"));
};

describe("DeleteAccount", () => {
  beforeEach(() => {
    mockMutate.mockReset();
  });

  it("deletes after the password and a second tap", () => {
    render(<DeleteAccount />);
    fireEvent.changeText(screen.getByPlaceholderText("Password"), "hemligt1");
    fireEvent.press(screen.getByText("Delete account"));
    expect(mockMutate).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText("Delete for good?"));
    expect(mockMutate).toHaveBeenCalledWith("hemligt1", expect.anything());
  });

  it("needs the password", () => {
    render(<DeleteAccount />);
    confirmDelete();
    expect(screen.getByText("Type your password")).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("shows why it failed", () => {
    mockMutate.mockImplementation((_password, options) => options.onError?.(new ApiError("errors.wrongPassword")));
    render(<DeleteAccount />);
    fireEvent.changeText(screen.getByPlaceholderText("Password"), "fel");
    confirmDelete();
    expect(screen.getByText("Wrong password")).toBeTruthy();
  });
});
