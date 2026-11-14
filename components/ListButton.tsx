import { spacing, textSize } from "@/constants/theme";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Icon from "@/components/Icon";
import { useColors, useThemedStyles } from "@/hooks/useTheme";
import { ListButtonProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// The open list's name and group. Tapping it opens all lists, where another one can be picked.
// A dot on the icon when another list has items that are new to the user.
export default function ListButton({ list, groupName, hasNewElsewhere, onPress }: ListButtonProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={hasNewElsewhere ? `${t("lists.title")}, ${t("lists.newElsewhere")}` : t("lists.title")}
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
    >
      <View>
        <Icon name="list" size={22} strokeWidth={2.5} color={colors.primary} />
        {hasNewElsewhere && <View style={styles.dot} testID="new-elsewhere" />}
      </View>
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
      gap: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.7,
    },
    // Over the icon's top right corner, ringed in the bar's colour so it stands out.
    dot: {
      position: "absolute",
      top: -3,
      right: -4,
      width: 11,
      height: 11,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.surface,
      backgroundColor: colors.danger,
    },
    // Takes the width between the icons; long names are cut off instead of pushing them out.
    text: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: textSize.title,
      fontWeight: "600",
      color: colors.text,
    },
    group: {
      fontSize: textSize.small,
      color: colors.textMuted,
    },
  });
