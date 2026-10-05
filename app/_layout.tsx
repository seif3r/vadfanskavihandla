import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";

// Initializes translations before anything renders.
import "@/i18n";

import UserMenu from "@/components/UserMenu";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ListsProvider } from "@/context/ListsContext";
import { useActivityNotifications } from "@/hooks/useActivityNotifications";
import { useActiveColorScheme, useColors } from "@/hooks/useTheme";

const queryClient = new QueryClient();

function RootStack() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const colors = useColors();
  useActivityNotifications();

  // Wait until the saved session is checked, so the login screen doesn't flash.
  if (isLoading) return null;

  return (
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
        <Stack.Screen name="lists" options={{ title: t("lists.title") }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ title: t("login.title") }} />
      </Stack.Protected>
    </Stack>
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
        <ListsProvider>
          <ThemedApp />
        </ListsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
