import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ApiError } from "@/api/ApiError";
import ChangePassword from "@/app/change-password";
import "@/i18n";
import { ChangePasswordRequest } from "@/types/api";

const mockMutateAsync = jest.fn<(request: ChangePasswordRequest) => Promise<void>>();

// The theme reads the logged-in user's setting; nobody is logged in here.
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
jest.mock("@/hooks/useChangePassword", () => ({
  useChangePassword: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

const fillIn = (current: string, next: string, repeated: string) => {
  fireEvent.changeText(screen.getByPlaceholderText("Current password"), current);
  fireEvent.changeText(screen.getByPlaceholderText("New password"), next);
  fireEvent.changeText(screen.getByPlaceholderText("Repeat new password"), repeated);
  fireEvent.press(screen.getByText("Change password"));
};

// The first render loads React Native's components, which is slow on a cold CI runner.
jest.setTimeout(20000);

describe("ChangePassword", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it("changes the password and clears the form", async () => {
    render(<ChangePassword />);
    fillIn("gammalt1", "nyttlösen", "nyttlösen");
    expect(await screen.findByText("Your password has been changed")).toBeTruthy();
    expect(mockMutateAsync).toHaveBeenCalledWith({ currentPassword: "gammalt1", newPassword: "nyttlösen" });
    expect(screen.getByPlaceholderText("New password").props.value).toBe("");
  });

  it("doesn't send a form whose new passwords differ", () => {
    render(<ChangePassword />);
    fillIn("gammalt1", "nyttlösen", "annat123");
    expect(screen.getByText("The new passwords don't match")).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("shows the minimum length", () => {
    render(<ChangePassword />);
    fillIn("gammalt1", "kort", "kort");
    expect(screen.getByText("The new password must be at least 6 characters")).toBeTruthy();
  });

  it("translates errors from the API", async () => {
    mockMutateAsync.mockRejectedValueOnce(new ApiError("errors.wrongPassword"));
    render(<ChangePassword />);
    fillIn("fel", "nyttlösen", "nyttlösen");
    await waitFor(() => expect(screen.getByText("Wrong password")).toBeTruthy());
    expect(screen.queryByText("Your password has been changed")).toBeNull();
  });
});
