import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Input from "@/components/Input";
import { radius } from "@/constants/theme";
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
        <Input value={amount} onChangeText={onAmountChange} placeholder={t("list.amountPlaceholder")} style={styles.amount} />
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
      gap: 10,
      paddingHorizontal: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    field: {
      gap: 4,
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
    amount: {
      minWidth: 0,
      width: 140,
    },
    chips: {
      gap: 6,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
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
