import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import Button from "@/components/Button";
import ConfirmButton from "@/components/ConfirmButton";
import Input from "@/components/Input";
import { MAX_GROUP_NAME_LENGTH } from "@/constants/limits";
import { radius } from "@/constants/theme";
import { cleanName } from "@/helpers/list";
import { useThemedStyles } from "@/hooks/useTheme";
import { GroupCardProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// A group with its members. Everyone can invite and leave; the owner can also rename
// the group, remove members and delete it. The last member can only delete.
export default function GroupCard({
  group, members, userId, onRename, onInvite, onRemoveMember, onLeave, onDelete,
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
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      minHeight: 50,
    },
    name: {
      flex: 1,
      fontSize: 17,
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
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      minHeight: 46,
    },
    divider: {
      borderTopWidth: 1,
      borderColor: colors.divider,
    },
    member: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    tag: {
      color: colors.textMuted,
      fontSize: 14,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      padding: 12,
    },
  });
