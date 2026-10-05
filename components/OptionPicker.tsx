import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { OptionPickerProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// A card of options with radio buttons, where exactly one is selected.
export default function OptionPicker<T extends string>({ options, value, onChange, disabled }: OptionPickerProps<T>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled || isSelected}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            style={[styles.option, index > 0 && styles.divider]}
          >
            <Text style={styles.name}>{option.label}</Text>
            <View style={[styles.radio, isSelected && styles.radioSelected]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.large,
      borderWidth: 1,
      borderColor: colors.border,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    divider: {
      borderTopWidth: 1,
      borderColor: colors.divider,
    },
    name: {
      fontSize: 16,
      color: colors.text,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
    },
    radioSelected: {
      borderColor: colors.primary,
      borderWidth: 6,
    },
  });
