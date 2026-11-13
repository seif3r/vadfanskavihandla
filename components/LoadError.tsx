import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import ErrorText from "@/components/ErrorText";
import Button from "@/components/Button";
import { spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { LoadErrorProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// Shown instead of an empty state when the data couldn't be loaded, so a failed load (offline,
// an index still building) doesn't look like everything is gone.
export default function LoadError({ error, onRetry }: LoadErrorProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ErrorText style={styles.text}>{t("loadError.message", { reason: t(error.key) })}</ErrorText>
      <Button value={t("loadError.retry")} variant="secondary" onPress={onRetry} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      gap: spacing.md,
    },
    text: {
      color: colors.danger,
      textAlign: "center",
    },
  });
