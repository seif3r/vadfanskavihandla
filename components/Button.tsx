import { Pressable, StyleSheet, Text } from "react-native";

import { radius } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { ButtonProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// "primary" (filled green) is for the main action on a screen; "secondary" for everything else.
export default function Button({ value, onPress, disabled, variant = "primary", compact }: ButtonProps) {
  const styles = useThemedStyles(createStyles);
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        isPrimary ? styles.primary : styles.secondary,
        pressed && (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
        disabled && styles.disabled,
      ]}
    >
      <Text
        numberOfLines={compact ? 1 : undefined}
        style={[styles.text, compact && styles.compactText, isPrimary ? styles.primaryText : styles.secondaryText]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: radius.medium,
      alignItems: "center",
      justifyContent: "center",
    },
    // Shares the row equally with its neighbours.
    compact: {
      flex: 1,
      minHeight: 40,
      paddingHorizontal: 8,
    },
    compactText: {
      fontSize: 13,
    },
    primary: {
      backgroundColor: colors.primary,
    },
    primaryPressed: {
      backgroundColor: colors.primaryPressed,
    },
    secondary: {
      backgroundColor: colors.primarySoft,
    },
    secondaryPressed: {
      backgroundColor: colors.border,
    },
    disabled: {
      opacity: 0.45,
    },
    text: {
      fontSize: 15,
      fontWeight: "600",
    },
    primaryText: {
      color: colors.textOnColor,
    },
    secondaryText: {
      color: colors.primaryText,
    },
  });
