import { StyleSheet, TextInput } from "react-native";

import { radius } from "@/constants/theme";
import { useColors, useThemedStyles } from "@/hooks/useTheme";
import { InputProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

export default function Input({ value, onChangeText, onSubmit, placeholder, secureTextEntry, style }: InputProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
      style={[styles.input, style]}
    />
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    input: {
      minHeight: 44,
      minWidth: 200,
      paddingHorizontal: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.medium,
    },
  });
