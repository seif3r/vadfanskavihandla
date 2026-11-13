import { StyleSheet, TextInput } from "react-native";

import { radius, spacing, textSize } from "@/constants/theme";
import { useColors, useThemedStyles } from "@/hooks/useTheme";
import { InputProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// The placeholder doubles as the label screen readers read, unless a label is given (a field without
// a placeholder, like renaming a group, needs one).
export default function Input({
  value, onChangeText, onSubmit, placeholder, secureTextEntry, maxLength, style, accessibilityLabel,
  keyboardType, autoComplete, textContentType, autoCapitalize = "none",
}: InputProps) {
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
      accessibilityLabel={accessibilityLabel ?? placeholder}
      keyboardType={keyboardType}
      autoComplete={autoComplete}
      textContentType={textContentType}
      autoCapitalize={autoCapitalize}
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
