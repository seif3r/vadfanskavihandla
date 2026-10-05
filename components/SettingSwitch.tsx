import { Pressable, StyleSheet, Switch, Text } from "react-native";

import { useColors, useThemedStyles } from "@/hooks/useTheme";
import { SettingSwitchProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// A settings row with a label and an on/off switch. The whole row is tappable.
export default function SettingSwitch({ label, value, onChange, disabled, isFirst }: SettingSwitchProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[styles.row, !isFirst && styles.divider]}
    >
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.primary, false: colors.border }}
        ios_backgroundColor={colors.border}
        thumbColor={colors.textOnColor}
      />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    divider: {
      borderTopWidth: 1,
      borderColor: colors.divider,
    },
    label: {
      flexShrink: 1,
      fontSize: 16,
      color: colors.text,
    },
  });
