import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import ConfirmButton from "@/components/ConfirmButton";
import { useThemedStyles } from "@/hooks/useTheme";
import { ListRowProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// A list, tapped to open it, with a delete button if the user may delete it.
// Deleting also removes the list's items.
export default function ListRow({ list, isActive, onPress, onDelete, isFirst }: ListRowProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  return (
    <View style={[styles.row, !isFirst && styles.divider]}>
      <Pressable onPress={onPress} accessibilityRole="button" style={styles.open}>
        <Text style={[styles.name, isActive && styles.active]}>{list.name}</Text>
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
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
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
      justifyContent: "center",
    },
    name: {
      fontSize: 16,
      color: colors.text,
    },
    active: {
      color: colors.primaryText,
      fontWeight: "600",
    },
  });
