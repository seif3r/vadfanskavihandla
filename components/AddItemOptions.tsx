import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Input from "@/components/Input";
import { MAX_AMOUNT_LENGTH } from "@/constants/limits";
import { radius, spacing, textSize } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { categories } from "@/helpers/categories";
import { AddItemOptionsProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// Extra fields for a new item, shown above the input bar when the ⋮ button is on.
export default function AddItemOptions({ amount, onAmountChange, category, onCategoryChange }: AddItemOptionsProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  return (
    <View style={styles.panel}>
      <View style={styles.field}>
        <Text style={styles.label}>{t("list.amount")}</Text>
        <Input
          value={amount}
          onChangeText={onAmountChange}
          placeholder={t("list.amountPlaceholder")}
          maxLength={MAX_AMOUNT_LENGTH}
          style={styles.amount}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{t("list.category")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((c) => {
            const isSelected = c === category;
            return (
              <Pressable
                key={c}
                // Tapping the selected category again clears it.
                onPress={() => onCategoryChange(isSelected ? undefined : c)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{t(`categories.${c}`)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    panel: {
      backgroundColor: colors.surface,
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    field: {
      gap: spacing.xxs,
    },
    label: {
      color: colors.textMuted,
      fontSize: textSize.caption,
      fontWeight: "600",
    },
    amount: {
      minWidth: 0,
      width: 140,
    },
    chips: {
      gap: spacing.xs,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      borderRadius: radius.round,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    chipText: {
      color: colors.text,
    },
    chipTextSelected: {
      color: colors.textOnColor,
    },
  });
