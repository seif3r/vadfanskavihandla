import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import Icon from "@/components/Icon";
import { useColors, useThemedStyles } from "@/hooks/useTheme";
import { ListTabsProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

export default function ListTabs({ lists, activeId, onSelect, onManage }: ListTabsProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bar}>
      {lists.map((list) => {
        const isActive = list.id === activeId;
        return (
          <Pressable key={list.id} onPress={() => onSelect(list.id)} style={[styles.tab, isActive && styles.activeTab]}>
            <Text style={[styles.text, isActive && styles.activeText]}>{list.name}</Text>
          </Pressable>
        );
      })}
      {/* Last "tab": opens the page where lists are added and removed. */}
      <Pressable
        onPress={onManage}
        accessibilityRole="button"
        accessibilityLabel={t("lists.manage")}
        style={[styles.tab, styles.manageTab]}
      >
        {/* Green in light mode, dark green in dark mode; thicker lines than the default 2. */}
        <Icon name="edit" size={20} strokeWidth={2.75} color={colors.primary} />
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // Never grow or shrink: keeps the tabs at full height however long the list is.
    bar: {
      flexGrow: 0,
      flexShrink: 0,
      width: "100%",
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 3,
      borderColor: "transparent",
    },
    activeTab: {
      borderColor: colors.primary,
    },
    text: {
      fontSize: 16,
      color: colors.textMuted,
    },
    activeText: {
      color: colors.primaryText,
      fontWeight: "600",
    },
    manageTab: {
      justifyContent: "center",
    },
  });
