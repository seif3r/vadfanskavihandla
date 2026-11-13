import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text } from "react-native";

import { ApiError } from "@/api/ApiError";
import ErrorText from "@/components/ErrorText";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { MIN_PASSWORD_LENGTH } from "@/constants/limits";
import { spacing, textSize } from "@/constants/theme";
import { checkNewPassword } from "@/helpers/password";
import { useChangePassword } from "@/hooks/useChangePassword";
import { useThemedStyles } from "@/hooks/useTheme";
import { ThemeColors } from "@/types/theme";

// Asks for the current password too: Firebase needs it to log in again before the change, and
// it stops someone at an unlocked phone from taking over the account.
export default function ChangePassword() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async () => {
    if (changePassword.isPending) return;
    setError(null);
    setIsDone(false);
    const problem = checkNewPassword(currentPassword, newPassword, repeatedPassword);
    if (problem) {
      setError(t(`changePassword.${problem}`, { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setRepeatedPassword("");
      setIsDone(true);
    } catch (e) {
      setError(t(e instanceof ApiError ? e.key : "errors.unknown"));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Input
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder={t("changePassword.current")}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      <Input
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder={t("changePassword.new")}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Input
        value={repeatedPassword}
        onChangeText={setRepeatedPassword}
        onSubmit={handleSubmit}
        placeholder={t("changePassword.confirm")}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {error && <ErrorText style={styles.error}>{error}</ErrorText>}
      {isDone && <Text style={styles.success}>{t("changePassword.success")}</Text>}
      <Button value={t("changePassword.submit")} onPress={handleSubmit} disabled={changePassword.isPending} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: spacing.xl,
      gap: spacing.md,
    },
    error: {
      color: colors.danger,
      fontSize: textSize.small,
    },
    success: {
      color: colors.primaryText,
      fontSize: textSize.small,
    },
  });
