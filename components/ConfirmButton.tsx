import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { CONFIRM_TIMEOUT_MS, CONFIRM_TIMEOUT_SCREEN_READER_MS } from "@/constants/limits";
import { radius, spacing } from "@/constants/theme";
import { useScreenReader } from "@/hooks/useScreenReader";
import { useThemedStyles } from "@/hooks/useTheme";
import { ConfirmButtonProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";


// A small red button for something that can't be undone, so it takes two taps: the first turns it
// into the confirm label ("Delete?"), the second calls onConfirm. Works the same on web and phones.
export default function ConfirmButton({ label, confirmLabel, onConfirm, disabled }: ConfirmButtonProps) {
  const styles = useThemedStyles(createStyles);
  const [isConfirming, setIsConfirming] = useState(false);
  const timeout = useScreenReader() ? CONFIRM_TIMEOUT_SCREEN_READER_MS : CONFIRM_TIMEOUT_MS;

  // Goes back to the plain label if the second tap doesn't come.
  useEffect(() => {
    if (!isConfirming) return;
    const timer = setTimeout(() => setIsConfirming(false), timeout);
    return () => clearTimeout(timer);
  }, [isConfirming, timeout]);

  const handlePress = () => {
    if (!isConfirming) return setIsConfirming(true);
    setIsConfirming(false);
    onConfirm();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.button, isConfirming && styles.confirm, disabled && styles.disabled]}
    >
      <Text style={[styles.text, isConfirming && styles.confirmText]}>{isConfirming ? confirmLabel : label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.small,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    disabled: {
      opacity: 0.4,
    },
    confirm: {
      backgroundColor: colors.danger,
    },
    text: {
      color: colors.danger,
    },
    confirmText: {
      color: colors.textOnDanger,
      fontWeight: "600",
    },
  });
