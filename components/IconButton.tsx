import { Pressable, StyleSheet } from "react-native";

import Icon from "@/components/Icon";
import { radius } from "@/constants/theme";
import { useColors, useThemedStyles } from "@/hooks/useTheme";
import { IconButtonProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

export default function IconButton({ icon, onPress, accessibilityLabel, active }: IconButtonProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: active }}
      // Bigger touch area than the visible button, so it's easy to hit on a phone.
      hitSlop={8}
      style={({ pressed }) => [styles.button, active && styles.active, pressed && styles.pressed]}
    >
      <Icon name={icon} size={22} color={active ? colors.primaryText : colors.textMuted} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      width: 40,
      height: 44,
      borderRadius: radius.medium,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    active: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    pressed: {
      opacity: 0.7,
    },
  });
