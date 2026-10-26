import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Icon from "@/components/Icon";
import { useColors, useThemedStyles } from "@/hooks/useTheme";
import { ListButtonProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// The open list's name and group. Tapping it opens all lists, where another one can be picked.
export default function ListButton({ list, groupName, onPress }: ListButtonProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("lists.title")}
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
    >
      <Icon name="list" size={22} strokeWidth={2.5} color={colors.primary} />
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.name}>{list.name}</Text>
        {groupName && <Text numberOfLines={1} style={styles.group}>{groupName}</Text>}
      </View>
      <Icon name="chevronRight" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.7,
    },
    // Takes the width between the icons; long names are cut off instead of pushing them out.
    text: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
    },
    group: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
