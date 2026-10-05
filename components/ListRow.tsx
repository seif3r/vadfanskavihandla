import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { ListRowProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

const CONFIRM_TIMEOUT_MS = 3000;

// A list with a delete button. Deleting also removes the list's items, so it takes two taps:
// the first turns the button into "Delete?", the second deletes. Works the same on web and phones.
export default function ListRow({ list, onDelete, isFirst }: ListRowProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);

  // Goes back to plain "Delete" if the second tap doesn't come.
  useEffect(() => {
    if (!isConfirming) return;
    const timer = setTimeout(() => setIsConfirming(false), CONFIRM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isConfirming]);

  const handleDelete = () => {
    if (isConfirming) onDelete();
    else setIsConfirming(true);
  };

  return (
    <View style={[styles.row, !isFirst && styles.divider]}>
      <Text style={styles.name}>{list.name}</Text>
      <Pressable onPress={handleDelete} hitSlop={8} style={[styles.delete, isConfirming && styles.confirm]}>
        <Text style={[styles.deleteText, isConfirming && styles.confirmText]}>
          {isConfirming ? t("lists.confirmDelete") : t("lists.delete")}
        </Text>
      </Pressable>
    </View>
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
    name: {
      flexShrink: 1,
      fontSize: 16,
      color: colors.text,
    },
    delete: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.small,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    confirm: {
      backgroundColor: colors.danger,
    },
    deleteText: {
      color: colors.danger,
    },
    confirmText: {
      color: colors.textOnDanger,
      fontWeight: "600",
    },
  });
