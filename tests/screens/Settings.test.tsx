import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { ApiError } from "@/api/ApiError";
import Settings from "@/app/settings";
import "@/i18n";
import { UserSettings } from "@/types/models";

const mockUpdateSettings = jest.fn<(settings: Partial<UserSettings>) => Promise<void>>();
const mockRequestPermission = jest.fn<() => Promise<boolean>>();

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "anna",
      name: "Anna",
      email: "anna@example.com",
      settings: { language: "en", theme: "system", notifications: { itemAdded: false, itemRemoved: false } },
    },
    updateSettings: mockUpdateSettings,
  }),
}));
jest.mock("@/helpers/notifications", () => ({ requestNotificationPermission: () => mockRequestPermission() }));
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

// The first render loads React Native's components, which is slow on a cold CI runner.
jest.setTimeout(20000);

describe("Settings", () => {
  beforeEach(() => {
    mockUpdateSettings.mockReset().mockResolvedValue(undefined);
    mockRequestPermission.mockReset().mockResolvedValue(true);
  });

  it("says why a setting couldn't be saved", async () => {
    mockUpdateSettings.mockRejectedValueOnce(new ApiError("errors.offline"));
    render(<Settings />);
    fireEvent.press(screen.getByText("Dark"));
    expect(await screen.findByText("Couldn't save. No connection. Check your internet and try again")).toBeTruthy();
  });

  it("treats a failed permission request as blocked", async () => {
    mockRequestPermission.mockRejectedValueOnce(new Error("no channel"));
    render(<Settings />);
    fireEvent.press(screen.getByText("When someone adds an item"));
    expect(await screen.findByText(/Notifications are blocked/)).toBeTruthy();
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });
});
