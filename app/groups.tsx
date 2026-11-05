import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError } from "@/api/ApiError";
import Button from "@/components/Button";
import GroupCard from "@/components/GroupCard";
import Input from "@/components/Input";
import { INVITE_LIFETIME_DAYS, MAX_GROUP_NAME_LENGTH } from "@/constants/limits";
import { useAuth } from "@/context/AuthContext";
import { cleanName } from "@/helpers/list";
import { shareText } from "@/helpers/share";
import { useGroups } from "@/hooks/useGroups";
import { spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { Group } from "@/types/models";
import { ThemeColors } from "@/types/theme";

// Creating, joining and managing the groups the user shops with.
export default function Groups() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const {
    groups, membersOf, removedMembersOf, createGroup, isCreating, renameGroup, leaveGroup, removeMember,
    allowRemovedMember, deleteGroup, createInvite, revokeInvite,
  } = useGroups();
  const [name, setName] = useState("");
  // The latest invite, also shown on screen: there's no share sheet in most desktop browsers.
  const [invite, setInvite] = useState<{ group: string; code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Runs an action and shows its error, translated, if it fails.
  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(t(e instanceof ApiError ? e.key : "errors.unknown"));
    }
  };

  const handleCreate = () => {
    const cleaned = cleanName(name);
    if (!cleaned) return;
    setName("");
    run(() => createGroup(cleaned));
  };

  const handleInvite = (group: Group) =>
    run(async () => {
      const code = await createInvite(group);
      setInvite({ group: group.name, code });
      await shareText(t("groups.shareMessage", { group: group.name, code, days: INVITE_LIFETIME_DAYS }));
    });

  const handleRevokeInvite = (code: string) =>
    run(async () => {
      await revokeInvite(code);
      // The code on screen no longer works.
      if (invite?.code === code) setInvite(null);
    });

  if (!user) return null;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.addRow}>
        <Input
          value={name}
          onChangeText={setName}
          onSubmit={handleCreate}
          placeholder={t("groups.newPlaceholder")}
          maxLength={MAX_GROUP_NAME_LENGTH}
          style={styles.input}
        />
        <Button value={t("groups.create")} onPress={handleCreate} disabled={isCreating} />
      </View>

      {groups.length === 0 && <Text style={styles.muted}>{t("groups.empty")}</Text>}

      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          members={membersOf(group)}
          removedMembers={removedMembersOf(group)}
          userId={user.id}
          onRename={(newName) => run(() => renameGroup(group, newName))}
          onInvite={() => handleInvite(group)}
          onRevokeInvite={handleRevokeInvite}
          onRemoveMember={(userId) => run(() => removeMember(group, userId))}
          onAllowRemovedMember={(userId) => run(() => allowRemovedMember(group, userId))}
          onLeave={() => run(() => leaveGroup(group))}
          onDelete={() => run(() => deleteGroup(group))}
        />
      ))}

      {invite && (
        <Text selectable style={styles.invite}>
          {t("groups.inviteCode", { group: invite.group, code: invite.code, days: INVITE_LIFETIME_DAYS })}
        </Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      <Button value={t("groups.join")} variant="secondary" onPress={() => router.push("/join")} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: spacing.xl,
      gap: spacing.xl,
    },
    addRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    // Fills all width the button doesn't use.
    input: {
      flex: 1,
      minWidth: 0,
    },
    muted: {
      color: colors.textMuted,
      textAlign: "center",
    },
    invite: {
      color: colors.text,
      textAlign: "center",
    },
    error: {
      color: colors.danger,
      textAlign: "center",
    },
  });
