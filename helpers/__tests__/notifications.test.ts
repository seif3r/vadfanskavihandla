import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Where the app runs is read when the file loads, so each test loads it anew with its own setup.
let mockPlatform: "android" | "web";
let mockExpoGo: boolean;
let mockProjectId: string | undefined;
const mockToast = jest.fn();
const mockNotifications = {
  getPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
};

jest.mock("expo", () => ({ isRunningInExpoGo: () => mockExpoGo }));
jest.mock("expo-constants", () => ({
  get expoConfig() {
    return { extra: { eas: { projectId: mockProjectId } } };
  },
}));
// Everything else falls through to the real module, read only when used (spreading it would
// touch every export and log deprecation warnings).
// The rest falls through to the real module, read only when used; spreading it would touch
// every export and log deprecation warnings, and leaving it out breaks Expo's test setup.
jest.mock("react-native", () =>
  Object.create(jest.requireActual<object>("react-native"), {
    Platform: {
      value: {
        get OS() {
          return mockPlatform;
        },
      },
    },
    ToastAndroid: { value: { LONG: 1, show: mockToast } },
  }),
);
jest.mock("expo-notifications", () => mockNotifications);
jest.mock("@/i18n", () => ({ t: (key: string) => key }));

function load(platform: typeof mockPlatform, expoGo: boolean, linkedToEas = true) {
  mockPlatform = platform;
  mockExpoGo = expoGo;
  mockProjectId = linkedToEas ? "project" : undefined;
  let notifications!: typeof import("@/helpers/notifications");
  jest.isolateModules(() => {
    notifications = require("@/helpers/notifications");
  });
  return notifications;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("canReceivePush", () => {
  it("is true in an installed build linked to EAS", () => {
    expect(load("android", false).canReceivePush).toBe(true);
  });
  it("is false in Expo Go, on web and without an EAS project", () => {
    expect(load("android", true).canReceivePush).toBe(false);
    expect(load("web", false).canReceivePush).toBe(false);
    expect(load("android", false, false).canReceivePush).toBe(false);
  });
});

// Installed builds load expo-notifications with a dynamic import, which Jest can't run, so only
// the paths that must not load it are tested here.
describe("getPushToken", () => {
  it("returns null in Expo Go without loading expo-notifications, which throws there", async () => {
    await expect(load("android", true).getPushToken()).resolves.toBeNull();
    expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled();
  });
  it("returns null on web", async () => {
    await expect(load("web", false).getPushToken()).resolves.toBeNull();
  });
});

describe("showNotification in Expo Go on Android", () => {
  it("shows a toast instead of a notification", async () => {
    await load("android", true).showNotification("Anna", "added milk");
    expect(mockToast).toHaveBeenCalledWith("Anna: added milk", 1);
    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
  it("counts notifications as allowed without asking", async () => {
    await expect(load("android", true).requestNotificationPermission()).resolves.toBe(true);
    expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled();
  });
});
