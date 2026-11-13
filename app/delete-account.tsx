import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import ConfirmButton from "@/components/ConfirmButton";
import Input from "@/components/Input";
import { spacing, textSize } from "@/constants/theme";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import { useThemedStyles } from "@/hooks/useTheme";
import { ThemeColors } from "@/types/theme";

// Says what deleting the account does, then asks for the password and a second tap.
export default function DeleteAccount() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const deleteAccount = useDeleteAccount();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteAccount.isPending) return;
    setError(null);
    if (!password) {
      setError(t("deleteAccount.passwordRequired"));
      return;
    }
    deleteAccount.mutate(password, { onError: (e) => setError(t(e.key)) });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.text}>{t("deleteAccount.intro")}</Text>
      <View style={styles.list}>
        <Text style={styles.text}>{"\u2022 "}{t("deleteAccount.soloGroups")}</Text>
        <Text style={styles.text}>{"\u2022 "}{t("deleteAccount.sharedGroups")}</Text>
        <Text style={styles.text}>{"\u2022 "}{t("deleteAccount.personalData")}</Text>
      </View>
      <Text style={styles.text}>{t("deleteAccount.permanent")}</Text>
      <Input
        value={password}
        onChangeText={setPassword}
        placeholder={t("deleteAccount.password")}
        secureTextEntry
      />
      {error && <Text style={styles.error} accessibilityLiveRegion="polite" role="alert">{error}</Text>}
      <View style={styles.actions}>
        <ConfirmButton
          label={t("deleteAccount.submit")}
          confirmLabel={t("deleteAccount.confirm")}
          onConfirm={handleDelete}
          disabled={deleteAccount.isPending}
        />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: spacing.xl,
      gap: spacing.md,
    },
    list: {
      gap: spacing.xs,
    },
    text: {
      color: colors.text,
    },
    error: {
      color: colors.danger,
      fontSize: textSize.small,
    },
    actions: {
      alignItems: "flex-start",
    },
  });
