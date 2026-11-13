import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import AppErrorBoundary from "@/components/AppErrorBoundary";
import CrashScreen from "@/components/CrashScreen";
import "@/i18n";

describe("CrashScreen", () => {
  // Rendered outside AuthProvider, so it must not need it (no mock of AuthContext here).
  it("explains and retries, without the logged-in user", () => {
    const retry = jest.fn();
    render(<CrashScreen error={new Error("boom")} retry={retry} />);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    fireEvent.press(screen.getByText("Try again"));
    expect(retry).toHaveBeenCalled();
  });

  it("is shown when something below the boundary throws, and retry renders it again", () => {
    let shouldThrow = true;
    const Flaky = () => {
      if (shouldThrow) throw new Error("boom");
      return <Text>Lists</Text>;
    };
    // React logs caught render errors; expected here.
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<AppErrorBoundary><Flaky /></AppErrorBoundary>);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    shouldThrow = false;
    fireEvent.press(screen.getByText("Try again"));
    expect(screen.getByText("Lists")).toBeTruthy();
    consoleError.mockRestore();
  });
});
