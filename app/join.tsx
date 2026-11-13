import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { ApiError } from "@/api/ApiError";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { findInviteCode } from "@/helpers/groups";
import { cleanName } from "@/helpers/list";
import { useGroups } from "@/hooks/useGroups";
import { spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { ThemeColors } from "@/types/theme";

// Joins a group with an invite code. A link like /join?code=... fills the code in.
export default function Join() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  // An array if the link has the parameter twice (?code=a&code=b): the first one counts.
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const { joinGroup } = useGroups();
  const [code, setCode] = useState((Array.isArray(params.code) ? params.code[0] : params.code) ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoin = async () => {
    if (!cleanName(code)) return;
    setError(null);
    const found = findInviteCode(code);
    if (!found) {
      setError(t("join.badFormat"));
      return;
    }
    setIsSubmitting(true);
    try {
      await joinGroup(found);
      router.replace("/groups");
    } catch (e) {
      setError(t(e instanceof ApiError ? e.key : "errors.unknown"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input value={code} onChangeText={setCode} onSubmit={handleJoin} placeholder={t("join.codePlaceholder")} />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button value={t("join.submit")} onPress={handleJoin} disabled={isSubmitting} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.xl,
    },
    error: {
      color: colors.danger,
    },
  });
