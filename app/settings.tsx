import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import OptionPicker from "@/components/OptionPicker";
import SettingSwitch from "@/components/SettingSwitch";
import { radius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { requestNotificationPermission } from "@/helpers/notifications";
import { useThemedStyles } from "@/hooks/useTheme";
import { languages } from "@/i18n";
import { Language } from "@/types/i18n";
import { NotificationSettings } from "@/types/models";
import { ThemeColors, ThemePreference } from "@/types/theme";

export default function Settings() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { user, updateSettings } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  if (!user) return null;
  const notifications = user.settings.notifications;

  const save = async (settings: Parameters<typeof updateSettings>[0]) => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = (language: Language) => save({ language });
  const handleThemeChange = (theme: ThemePreference) => save({ theme });

  const languageOptions = languages.map((l) => ({ value: l.code, label: l.name }));
  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: "system", label: t("settings.themeSystem") },
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
  ];

  const handleNotificationChange = async (key: keyof NotificationSettings, value: boolean) => {
    // Turning one on asks the device/browser for permission; without it, the setting stays off.
    if (value && !(await requestNotificationPermission())) {
      setIsBlocked(true);
      return;
    }
    setIsBlocked(false);
    await save({ notifications: { ...notifications, [key]: value } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
      <OptionPicker
        options={languageOptions}
        value={user.settings.language}
        onChange={handleLanguageChange}
        disabled={isSaving}
      />

      <Text style={[styles.sectionTitle, styles.section]}>{t("settings.appearance")}</Text>
      <OptionPicker options={themeOptions} value={user.settings.theme} onChange={handleThemeChange} disabled={isSaving} />

      <Text style={[styles.sectionTitle, styles.section]}>{t("settings.notifications")}</Text>
      <View style={styles.group}>
        <SettingSwitch
          label={t("settings.notifyItemAdded")}
          value={notifications.itemAdded}
          onChange={(value) => handleNotificationChange("itemAdded", value)}
          disabled={isSaving}
          isFirst
        />
        <SettingSwitch
          label={t("settings.notifyItemCompleted")}
          value={notifications.itemCompleted}
          onChange={(value) => handleNotificationChange("itemCompleted", value)}
          disabled={isSaving}
        />
      </View>
      {isBlocked && <Text style={styles.blocked}>{t("settings.notificationsBlocked")}</Text>}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: 16,
      gap: 8,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      paddingHorizontal: 4,
    },
    section: {
      marginTop: 16,
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.large,
      borderWidth: 1,
      borderColor: colors.border,
    },
    blocked: {
      color: colors.danger,
      fontSize: 13,
      paddingHorizontal: 4,
    },
  });
