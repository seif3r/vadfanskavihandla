import { useColorScheme } from "react-native";

import { palettes } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ColorScheme, ThemeColors } from "@/types/theme";

// Light or dark: the user's choice in Settings, or the device's setting when it's "system"
// (always the case on the login screen, before anyone is logged in).
export function useActiveColorScheme(): ColorScheme {
  const device = useColorScheme() === "dark" ? "dark" : "light";
  const preference = useAuth().user?.settings.theme ?? "system";
  return preference === "system" ? device : preference;
}

// The active palette.
export function useColors(): ThemeColors {
  return palettes[useActiveColorScheme()];
}

// Builds a component's styles from the active palette, so they follow light/dark mode.
// Usage: const createStyles = (colors: ThemeColors) => StyleSheet.create({...});
//        const styles = useThemedStyles(createStyles);
// (The React Compiler memoizes the result, so styles are only rebuilt when the palette changes.)
export function useThemedStyles<T>(createStyles: (colors: ThemeColors) => T): T {
  return createStyles(useColors());
}
