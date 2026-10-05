import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { radius } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { ThemeColors } from "@/types/theme";

export default function UserMenu() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleSettings = () => {
    setIsOpen(false);
    router.push("/settings");
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <>
      <Pressable onPress={() => setIsOpen(true)} style={styles.trigger}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
      </Pressable>

      {/* Modal instead of an absolutely positioned dropdown, so the menu
          isn't clipped by the header and a tap outside closes it. */}
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuName}>{user.name}</Text>
              <Text style={styles.menuEmail}>{user.email}</Text>
            </View>
            <Pressable onPress={handleSettings} style={styles.menuItem}>
              <Text style={styles.menuText}>{t("userMenu.settings")}</Text>
            </Pressable>
            <Pressable onPress={handleLogout} style={[styles.menuItem, styles.divider]}>
              <Text style={styles.logout}>{t("userMenu.logout")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: radius.round,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: colors.textOnColor,
      fontWeight: "600",
    },
    name: {
      fontSize: 16,
      color: colors.text,
    },
    backdrop: {
      flex: 1,
      backgroundColor: colors.backdrop,
      alignItems: "flex-end",
      paddingTop: 56,
      paddingRight: 12,
    },
    menu: {
      backgroundColor: colors.surface,
      borderRadius: radius.large,
      minWidth: 200,
      paddingVertical: 4,
      shadowColor: colors.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    menuHeader: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: colors.divider,
    },
    menuName: {
      fontWeight: "600",
      color: colors.text,
    },
    menuEmail: {
      color: colors.textMuted,
      fontSize: 12,
    },
    menuItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    divider: {
      borderTopWidth: 1,
      borderColor: colors.divider,
    },
    menuText: {
      color: colors.text,
    },
    logout: {
      color: colors.danger,
    },
  });
