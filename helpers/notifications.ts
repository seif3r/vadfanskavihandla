// Shows system notifications: expo-notifications on phones, the browser's Notification API on web.
import { isRunningInExpoGo } from "expo";
import { Platform, ToastAndroid } from "react-native";

const isWeb = Platform.OS === "web";
const hasWebNotifications = () => typeof Notification !== "undefined";

// Expo Go on Android dropped expo-notifications support in SDK 53: importing the module throws
// there. So it is only loaded where it works, and Expo Go on Android falls back to a toast.
// A development build (npx expo run:android) gets real notifications.
const isExpoGoAndroid = Platform.OS === "android" && isRunningInExpoGo();

let notificationsModule: Promise<typeof import("expo-notifications")> | null = null;

function loadNotifications() {
  if (!notificationsModule) {
    notificationsModule = import("expo-notifications").then((Notifications) => {
      // Show notifications as banners even while the app is open.
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      return Notifications;
    });
  }
  return notificationsModule;
}

// Asks for permission if it hasn't been given yet. Returns whether notifications are allowed.
export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb) {
    if (!hasWebNotifications()) return false;
    if (Notification.permission === "granted") return true;
    return (await Notification.requestPermission()) === "granted";
  }
  if (isExpoGoAndroid) return true;
  const Notifications = await loadNotifications();
  if (Platform.OS === "android") {
    // Android 13+ only shows the permission prompt once a channel exists.
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function showNotification(title: string, body: string): Promise<void> {
  if (isWeb) {
    if (hasWebNotifications() && Notification.permission === "granted") new Notification(title, { body });
    return;
  }
  if (isExpoGoAndroid) {
    ToastAndroid.show(`${title}: ${body}`, ToastAndroid.LONG);
    return;
  }
  const Notifications = await loadNotifications();
  // trigger: null = show right away.
  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
}
