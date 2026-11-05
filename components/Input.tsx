import { StyleSheet, TextInput } from "react-native";

import { radius, spacing, textSize } from "@/constants/theme";
import { useColors, useThemedStyles } from "@/hooks/useTheme";
import { InputProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

export default function Input({ value, onChangeText, onSubmit, placeholder, secureTextEntry, maxLength, style }: InputProps) {
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
      maxLength={maxLength}
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
      paddingHorizontal: spacing.lg,
      fontSize: textSize.body,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.medium,
    },
  });
