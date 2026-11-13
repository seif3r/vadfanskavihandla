import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { ApiError } from "@/api/ApiError";
import LoadError from "@/components/LoadError";
import "@/i18n";

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));

describe("LoadError", () => {
  it("says why loading failed and retries", () => {
    const onRetry = jest.fn();
    render(<LoadError error={new ApiError("errors.offline")} onRetry={onRetry} />);
    expect(screen.getByText("Couldn't load. No connection. Check your internet and try again")).toBeTruthy();
    fireEvent.press(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalled();
  });
});
