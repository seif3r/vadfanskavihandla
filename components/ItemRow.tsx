import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Icon from "@/components/Icon";
import { radius } from "@/constants/theme";
import { useColors, useThemedStyles } from "@/hooks/useTheme";
import { ItemRowProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

export default function ItemRow({ item, onToggle, isFirst }: ItemRowProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.done }}
      style={({ pressed }) => [
        styles.row,
        !isFirst && styles.divider,
        item.done && styles.doneRow,
        pressed && styles.pressed,
      ]}
    >
      {/* Drawn instead of ☐/☑ characters, which look different on every device. */}
      <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
        {item.done && <Icon name="check" size={14} strokeWidth={3.5} color={colors.textOnColor} />}
      </View>
      <View style={styles.text}>
        <Text style={[styles.name, item.done && styles.doneText]}>
          {item.name}
          {item.amount && <Text style={styles.amount}> · {item.amount}</Text>}
        </Text>
        {item.category && <Text style={styles.category}>{t(`categories.${item.category}`)}</Text>}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 48,
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
    },
    divider: {
      borderTopWidth: 1,
      borderColor: colors.divider,
    },
    doneRow: {
      backgroundColor: colors.doneBackground,
    },
    pressed: {
      opacity: 0.7,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius.small,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxDone: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    // Takes the rest of the row, so the category lines up on the right.
    text: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    name: {
      flexShrink: 1,
      fontSize: 16,
      color: colors.text,
    },
    amount: {
      color: colors.textMuted,
    },
    category: {
      color: colors.textMuted,
      fontSize: 12,
    },
    doneText: {
      textDecorationLine: "line-through",
      color: colors.doneText,
    },
  });
