import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import Button from "@/components/Button";
import ConfirmButton from "@/components/ConfirmButton";
import GroupInvites from "@/components/GroupInvites";
import Input from "@/components/Input";
import { MAX_GROUP_NAME_LENGTH } from "@/constants/limits";
import { radius, spacing, textSize } from "@/constants/theme";
import { cleanName } from "@/helpers/list";
import { useThemedStyles } from "@/hooks/useTheme";
import { GroupCardProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// A group with its members. Everyone can invite and leave; the owner can also rename
// the group, remove members, revoke invites and delete it. The last member can only delete.
export default function GroupCard({
  group, members, removedMembers, userId, onRename, onInvite, onRevokeInvite, onRemoveMember, onAllowRemovedMember,
  onLeave, onDelete,
}: GroupCardProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [name, setName] = useState<string | null>(null);
  const isOwner = group.ownerId === userId;
  const isAlone = group.memberIds.length === 1;

  const handleRename = () => {
    const cleaned = cleanName(name ?? "");
    if (cleaned && cleaned !== group.name) onRename(cleaned);
    setName(null);
  };

  return (
    <View style={styles.card}>
      {name === null ? (
        <View style={styles.header}>
          <Text style={styles.name}>{group.name}</Text>
          {isOwner && <Button value={t("groups.rename")} variant="secondary" compact onPress={() => setName(group.name)} />}
        </View>
      ) : (
        <View style={styles.header}>
          <Input
            value={name}
            onChangeText={setName}
            onSubmit={handleRename}
            maxLength={MAX_GROUP_NAME_LENGTH}
            style={styles.input}
          />
          <Button value={t("groups.save")} compact onPress={handleRename} />
        </View>
      )}

      {members.map((member) => (
        <View key={member.id} style={[styles.row, styles.divider]}>
          <Text style={styles.member}>
            {member.name}
            {member.id === group.ownerId && <Text style={styles.tag}> · {t("groups.owner")}</Text>}
            {member.id === userId && <Text style={styles.tag}> · {t("groups.you")}</Text>}
          </Text>
          {isOwner && member.id !== userId && (
            <ConfirmButton
              label={t("groups.remove")}
              confirmLabel={t("groups.confirmRemove")}
              onConfirm={() => onRemoveMember(member.id)}
            />
          )}
        </View>
      ))}

      {isOwner && removedMembers.length > 0 && (
        <>
          <Text style={[styles.heading, styles.divider]}>{t("groups.removedMembers")}</Text>
          {removedMembers.map((member) => (
            <View key={member.id} style={styles.row}>
              <Text style={styles.member}>{member.name}</Text>
              <Button
                value={t("groups.allowRemovedMember")}
                variant="secondary"
                compact
                onPress={() => onAllowRemovedMember(member.id)}
              />
            </View>
          ))}
        </>
      )}

      {isOwner && <GroupInvites group={group} onRevoke={onRevokeInvite} />}

      <View style={[styles.actions, styles.divider]}>
        <Button value={t("groups.invite")} variant="secondary" compact onPress={onInvite} />
        {!isAlone && <ConfirmButton label={t("groups.leave")} confirmLabel={t("groups.confirmLeave")} onConfirm={onLeave} />}
        {isOwner && <ConfirmButton label={t("groups.delete")} confirmLabel={t("groups.confirmDelete")} onConfirm={onDelete} />}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.large,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      minHeight: 50,
    },
    name: {
      flex: 1,
      fontSize: textSize.title,
      fontWeight: "600",
      color: colors.text,
    },
    // Fills all width the button doesn't use.
    input: {
      flex: 1,
      minWidth: 0,
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
    divider: {
      borderTopWidth: 1,
      borderColor: colors.divider,
    },
    heading: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      fontSize: textSize.medium,
      color: colors.textMuted,
    },
    member: {
      flex: 1,
      fontSize: textSize.body,
      color: colors.text,
    },
    tag: {
      color: colors.textMuted,
      fontSize: textSize.medium,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.lg,
    },
  });
