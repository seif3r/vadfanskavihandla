import { StyleSheet, Text } from "react-native";

import { useThemedStyles } from "@/hooks/useTheme";
import { ErrorTextProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// An error message that screen readers announce when it appears (a live region on Android, an
// alert on web and iOS), so someone who can't see it still learns the action failed.
export default function ErrorText({ children, style }: ErrorTextProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Text style={[styles.error, style]} accessibilityLiveRegion="polite" role="alert">
      {children}
    </Text>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    error: {
      color: colors.danger,
    },
  });
