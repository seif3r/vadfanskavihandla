import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import ConfirmButton from "@/components/ConfirmButton";
import { radius, spacing, textSize } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { ListRowProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// A list, tapped to open it, with a delete button if the user may delete it.
// Deleting also removes the list's items.
// Shows how many items it has and, as a pill, how many are new to the user.
export default function ListRow({ list, count, isActive, onPress, onDelete, isFirst }: ListRowProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const unseen = count?.unseen ?? 0;
  // Read out as one: "ICA, 12 items, 3 new".
  const label = [
    list.name,
    count && t("lists.itemCount", { count: count.total }),
    unseen > 0 && t("lists.newCount", { count: unseen }),
  ].filter(Boolean).join(", ");

  return (
    <View style={[styles.row, !isFirst && styles.divider]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: !!isActive }}
        accessibilityLabel={label}
        style={styles.open}
      >
        <Text style={[styles.name, isActive && styles.active]}>{list.name}</Text>
        {count && <Text style={styles.count}>{t("lists.itemCount", { count: count.total })}</Text>}
        {unseen > 0 && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{t("lists.newCount", { count: unseen })}</Text>
          </View>
        )}
      </Pressable>
      {onDelete && <ConfirmButton label={t("lists.delete")} confirmLabel={t("lists.confirmDelete")} onConfirm={onDelete} />}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      minHeight: 50,
    },
    divider: {
      borderTopWidth: 1,
      borderColor: colors.divider,
    },
    // The whole row left of the delete button opens the list.
    open: {
      flex: 1,
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    // Takes the room the count and pill don't, so they stay at the right edge.
    name: {
      flex: 1,
      fontSize: textSize.body,
      color: colors.text,
    },
    count: {
      fontSize: textSize.small,
      color: colors.textMuted,
    },
    pill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radius.round,
      backgroundColor: colors.primary,
    },
    pillText: {
      fontSize: textSize.small,
      fontWeight: "600",
      color: colors.textOnColor,
    },
    active: {
      color: colors.primaryText,
      fontWeight: "600",
    },
  });
