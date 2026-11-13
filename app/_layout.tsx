import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

// Initializes translations before anything renders.
import "@/i18n";

import Button from "@/components/Button";
import LoadError from "@/components/LoadError";
import UserMenu from "@/components/UserMenu";
import { spacing } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ActiveListProvider } from "@/context/ActiveListContext";
import { LiveStatusProvider } from "@/context/LiveStatusContext";
import { useLiveUpdates } from "@/hooks/useLiveUpdates";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { useActiveColorScheme, useColors } from "@/hooks/useTheme";

const queryClient = new QueryClient();

function RootStack() {
  const { t } = useTranslation();
  const { user, isLoading, loadError, reload, logout } = useAuth();
  const colors = useColors();
  const liveError = useLiveUpdates();
  usePushRegistration();

  // Wait until the saved session is checked, so the login screen doesn't flash.
  if (isLoading) return null;

  // Logged in, but the user couldn't be loaded (no connection): offer a retry instead of the login screen.
  if (loadError) {
    return (
      <View style={[styles.startupError, { backgroundColor: colors.background }]}>
        <LoadError error={loadError} onRetry={reload} />
        <Button value={t("userMenu.logout")} variant="secondary" onPress={logout} />
      </View>
    );
  }

  return (
    <LiveStatusProvider value={liveError}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "600" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!!user}>
          <Stack.Screen
            name="index"
            options={{ title: t("list.title"), headerRight: () => <UserMenu /> }}
          />
          <Stack.Screen name="settings" options={{ title: t("settings.title") }} />
          <Stack.Screen name="change-password" options={{ title: t("changePassword.title") }} />
          <Stack.Screen name="lists" options={{ title: t("lists.title") }} />
          <Stack.Screen name="groups" options={{ title: t("groups.title") }} />
          <Stack.Screen name="join" options={{ title: t("join.title") }} />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ title: t("login.title") }} />
        </Stack.Protected>
      </Stack>
    </LiveStatusProvider>
  );
}

// Applies light/dark mode to navigation and the status bar. Sits inside AuthProvider,
// because the user's appearance setting decides which one.
function ThemedApp() {
  const isDark = useActiveColorScheme() === "dark";
  const colors = useColors();
  const base = isDark ? DarkTheme : DefaultTheme;
  // Navigation's own colours (header, screen background, borders) from our palette,
  // so nothing flashes white in dark mode during screen transitions.
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      {/* Light icons on dark backgrounds and the other way around. */}
      <StatusBar style={isDark ? "light" : "dark"} />
      <RootStack />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveListProvider>
          <ThemedApp />
        </ActiveListProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  startupError: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
});
