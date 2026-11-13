import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { ApiError } from "@/api/ApiError";
import Login from "@/app/login";
import "@/i18n";
import { ResetPasswordRequest } from "@/types/api";

type MutateOptions = { onSuccess?: () => void; onError?: (error: ApiError) => void };
const mockMutate = jest.fn<(request: ResetPasswordRequest, options: MutateOptions) => void>();

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null, login: jest.fn(), register: jest.fn() }) }));
jest.mock("@/hooks/useResetPassword", () => ({
  useResetPassword: () => ({ mutate: mockMutate, isPending: false }),
}));

// The first render loads React Native's components, which is slow on a cold CI runner.
jest.setTimeout(20000);

describe("Login: forgot password", () => {
  beforeEach(() => {
    mockMutate.mockReset();
  });

  it("asks for the email first", () => {
    render(<Login />);
    fireEvent.press(screen.getByText("Forgot your password?"));
    expect(screen.getByText("Type your email first")).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("sends the reset email to the address typed in and says so", () => {
    mockMutate.mockImplementation((_request, options) => options.onSuccess?.());
    render(<Login />);
    fireEvent.changeText(screen.getByPlaceholderText("Email"), " anna@example.com ");
    fireEvent.press(screen.getByText("Forgot your password?"));
    expect(mockMutate).toHaveBeenCalledWith({ email: "anna@example.com", language: "en" }, expect.anything());
    expect(screen.getByText(/If anna@example.com has an account/)).toBeTruthy();
  });

  it("shows why it couldn't be sent", () => {
    mockMutate.mockImplementation((_request, options) => options.onError?.(new ApiError("errors.offline")));
    render(<Login />);
    fireEvent.changeText(screen.getByPlaceholderText("Email"), "anna@example.com");
    fireEvent.press(screen.getByText("Forgot your password?"));
    expect(screen.getByText("No connection. Check your internet and try again")).toBeTruthy();
  });

  it("isn't offered while creating an account", () => {
    render(<Login />);
    fireEvent.press(screen.getByText("No account? Create one"));
    expect(screen.queryByText("Forgot your password?")).toBeNull();
  });
});
