import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/ApiError";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { MAX_PERSON_NAME_LENGTH } from "@/constants/limits";
import { useThemedStyles } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { cleanName } from "@/helpers/list";
import { ThemeColors } from "@/types/theme";

// Logging in, or creating an account (which also needs a name, shown to the people you share lists with).
export default function Login() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
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

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
  };

  return (
    <View style={styles.container}>
      {isRegistering && (
        <Input value={name} onChangeText={setName} placeholder={t("login.name")} maxLength={MAX_PERSON_NAME_LENGTH} />
      )}
      <Input value={email} onChangeText={setEmail} placeholder={t("login.email")} />
      <Input
        value={password}
        onChangeText={setPassword}
        onSubmit={handleSubmit}
        placeholder={t("login.password")}
        secureTextEntry
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        value={isRegistering ? t("login.register") : t("login.submit")}
        onPress={handleSubmit}
        disabled={isSubmitting}
      />
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
      gap: 10,
    },
    error: {
      color: colors.danger,
    },
  });
