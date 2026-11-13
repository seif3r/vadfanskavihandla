import { ErrorBoundaryProps } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { palettes, radius, spacing, textSize } from "@/constants/theme";

// Shown instead of a white screen when a screen crashes while rendering. It can sit outside the
// providers (the root layout's ErrorBoundary wraps them), so it uses the device's light/dark mode
// and plain components instead of the themed ones, which need the logged-in user.
export default function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  const colors = palettes[useColorScheme() === "dark" ? "dark" : "light"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t("crash.title")}</Text>
      <Text style={{ color: colors.textMuted }}>{t("crash.message")}</Text>
      {__DEV__ && <Text style={{ color: colors.danger }}>{error.message}</Text>}
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.buttonText, { color: colors.textOnColor }]}>{t("crash.retry")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    fontSize: textSize.title,
    fontWeight: "600",
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.medium,
  },
  buttonText: {
    fontWeight: "600",
  },
});
