import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import ConfirmButton from "@/components/ConfirmButton";
import { spacing, textSize } from "@/constants/theme";
import { useInvites } from "@/hooks/useInvites";
import { useThemedStyles } from "@/hooks/useTheme";
import { GroupInvitesProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// The invite codes that still work, for the group's owner to revoke.
export default function GroupInvites({ group, onRevoke }: GroupInvitesProps) {
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const invites = useInvites(group);

  if (invites.length === 0) return null;

  return (
    <>
      <Text style={[styles.heading, styles.divider]}>{t("groups.activeInvites")}</Text>
      {invites.map((invite) => (
        <View key={invite.code} style={styles.row}>
          <View style={styles.details}>
            <Text selectable style={styles.code}>{invite.code}</Text>
            <Text style={styles.expires}>
              {t("groups.inviteValidUntil", { date: new Date(invite.expiresAt).toLocaleDateString(i18n.language) })}
            </Text>
          </View>
          <ConfirmButton
            label={t("groups.revokeInvite")}
            confirmLabel={t("groups.confirmRevokeInvite")}
            onConfirm={() => onRevoke(invite.code)}
          />
        </View>
      ))}
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    heading: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      fontSize: textSize.medium,
      color: colors.textMuted,
    },
    divider: {
      borderTopWidth: 1,
      borderColor: colors.divider,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      minHeight: 46,
    },
    details: {
      flex: 1,
    },
    code: {
      fontSize: textSize.body,
      color: colors.text,
    },
    expires: {
      fontSize: textSize.medium,
      color: colors.textMuted,
    },
  });
