import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import CrashScreen from "@/components/CrashScreen";
import "@/i18n";

describe("CrashScreen", () => {
  // Rendered outside AuthProvider, so it must not need it (no mock of AuthContext here).
  it("explains and retries, without the logged-in user", () => {
    const retry = jest.fn(() => Promise.resolve());
    render(<CrashScreen error={new Error("boom")} retry={retry} />);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    fireEvent.press(screen.getByText("Try again"));
    expect(retry).toHaveBeenCalled();
  });
});
