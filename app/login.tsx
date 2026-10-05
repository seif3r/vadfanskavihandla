import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/ApiError";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useThemedStyles } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { ThemeColors } from "@/types/theme";

export default function Login() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof ApiError ? t(e.key) : t("login.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input value={email} onChangeText={setEmail} placeholder={t("login.email")} />
      <Input
        value={password}
        onChangeText={setPassword}
        onSubmit={handleLogin}
        placeholder={t("login.password")}
        secureTextEntry
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button value={t("login.submit")} onPress={handleLogin} disabled={isSubmitting} />
      <Text style={styles.hint}>{t("login.testAccountHint", { email: "anna@example.com" })}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },
    error: {
      color: colors.danger,
    },
    hint: {
      color: colors.textMuted,
      fontSize: 12,
    },
  });
