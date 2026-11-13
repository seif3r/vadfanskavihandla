import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/ApiError";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { MAX_EMAIL_LENGTH, MAX_PERSON_NAME_LENGTH } from "@/constants/limits";
import { spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useResetPassword } from "@/hooks/useResetPassword";
import { cleanName } from "@/helpers/list";
import { ThemeColors } from "@/types/theme";

// Logging in, or creating an account (which also needs a name, shown to the people you share lists with).
export default function Login() {
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const { login, register } = useAuth();
  const resetPassword = useResetPassword();
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setResetSentTo(null);
    const cleanedName = cleanName(name);
    if (isRegistering && !cleanedName) {
      setError(t("login.nameRequired"));
      return;
    }
    setIsSubmitting(true);
    try {
      if (isRegistering) await register(cleanedName!, email, password);
      else await login(email, password);
    } catch (e) {
      setError(e instanceof ApiError ? t(e.key) : t("login.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Uses the email already typed in, so there's no separate form.
  const handleForgotPassword = () => {
    setError(null);
    setResetSentTo(null);
    const address = email.trim();
    if (!address) {
      setError(t("login.emailRequired"));
      return;
    }
    resetPassword.mutate(
      { email: address, language: i18n.language },
      {
        onSuccess: () => setResetSentTo(address),
        onError: (e) => setError(t(e.key)),
      },
    );
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setResetSentTo(null);
  };

  return (
    <View style={styles.container}>
      {isRegistering && (
        <Input value={name} onChangeText={setName} placeholder={t("login.name")} maxLength={MAX_PERSON_NAME_LENGTH} />
      )}
      <Input value={email} onChangeText={setEmail} placeholder={t("login.email")} maxLength={MAX_EMAIL_LENGTH} />
      <Input
        value={password}
        onChangeText={setPassword}
        onSubmit={handleSubmit}
        placeholder={t("login.password")}
        secureTextEntry
      />
      {error && <Text style={styles.error} accessibilityLiveRegion="polite" role="alert">{error}</Text>}
      {resetSentTo && (
        <Text style={styles.info} accessibilityLiveRegion="polite">{t("login.resetSent", { email: resetSentTo })}</Text>
      )}
      <Button
        value={isRegistering ? t("login.register") : t("login.submit")}
        onPress={handleSubmit}
        disabled={isSubmitting}
      />
      {!isRegistering && (
        <Button
          value={t("login.forgotPassword")}
          variant="secondary"
          onPress={handleForgotPassword}
          disabled={resetPassword.isPending}
        />
      )}
      <Button
        value={isRegistering ? t("login.switchToLogin") : t("login.switchToRegister")}
        variant="secondary"
        onPress={toggleMode}
      />
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
    },
    error: {
      color: colors.danger,
      textAlign: "center",
      paddingHorizontal: spacing.xl,
    },
    info: {
      color: colors.text,
      textAlign: "center",
      paddingHorizontal: spacing.xl,
    },
  });
