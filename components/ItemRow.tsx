import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Icon from "@/components/Icon";
import { radius, spacing, textSize } from "@/constants/theme";
import { useColors, useThemedStyles } from "@/hooks/useTheme";
import { ItemRowProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// Two tap targets side by side, not one inside the other: a button inside a checkbox can't be
// reached by screen readers. The row checks the item off; the pen on the right edits it.
export default function ItemRow({ item, onToggle, onEdit, isEditing, isFirst, onLayout }: ItemRowProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View
      onLayout={onLayout && ((event) => onLayout(event.nativeEvent.layout))}
      style={[styles.row, !isFirst && styles.divider, item.done && styles.doneRow, isEditing && styles.editingRow]}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.done }}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
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
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={t("list.editItem", { name: item.name })}
        accessibilityState={{ selected: isEditing }}
        hitSlop={4}
        style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
      >
        <Icon name="edit" size={18} color={isEditing ? colors.primaryText : colors.textMuted} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: 48,
      backgroundColor: colors.surface,
    },
    toggle: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      paddingVertical: spacing.md,
      paddingLeft: spacing.xl,
    },
    // As tall as the row and wide enough to hit with a thumb.
    edit: {
      width: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    divider: {
      borderTopWidth: 1,
      borderColor: colors.divider,
    },
    doneRow: {
      backgroundColor: colors.doneBackground,
    },
    editingRow: {
      backgroundColor: colors.primarySoft,
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
      gap: spacing.sm,
    },
    name: {
      flexShrink: 1,
      fontSize: textSize.body,
      color: colors.text,
    },
    amount: {
      color: colors.textMuted,
    },
    category: {
      color: colors.textMuted,
      fontSize: textSize.caption,
    },
    doneText: {
      textDecorationLine: "line-through",
      color: colors.doneText,
    },
  });
