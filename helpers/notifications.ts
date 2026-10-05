// Shows system notifications: expo-notifications on phones, the browser's Notification API on web.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";
const hasWebNotifications = () => typeof Notification !== "undefined";

if (!isWeb) {
  // Show notifications as banners even while the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Asks for permission if it hasn't been given yet. Returns whether notifications are allowed.
export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb) {
    if (!hasWebNotifications()) return false;
    if (Notification.permission === "granted") return true;
    return (await Notification.requestPermission()) === "granted";
  }
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
  // trigger: null = show right away.
  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
}
