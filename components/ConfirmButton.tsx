import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { radius } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { ConfirmButtonProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

const CONFIRM_TIMEOUT_MS = 3000;

// A small red button for something that can't be undone, so it takes two taps: the first turns it
// into the confirm label ("Delete?"), the second calls onConfirm. Works the same on web and phones.
export default function ConfirmButton({ label, confirmLabel, onConfirm }: ConfirmButtonProps) {
  const styles = useThemedStyles(createStyles);
  const [isConfirming, setIsConfirming] = useState(false);

  // Goes back to the plain label if the second tap doesn't come.
  useEffect(() => {
    if (!isConfirming) return;
    const timer = setTimeout(() => setIsConfirming(false), CONFIRM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isConfirming]);

  const handlePress = () => {
    if (!isConfirming) return setIsConfirming(true);
    setIsConfirming(false);
    onConfirm();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8} style={[styles.button, isConfirming && styles.confirm]}>
      <Text style={[styles.text, isConfirming && styles.confirmText]}>{isConfirming ? confirmLabel : label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.small,
      borderWidth: 1,
      borderColor: colors.danger,
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
