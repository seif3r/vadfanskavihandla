import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError } from "@/api/ApiError";
import Button from "@/components/Button";
import GroupCard from "@/components/GroupCard";
import Input from "@/components/Input";
import { MAX_GROUP_NAME_LENGTH } from "@/constants/limits";
import { useAuth } from "@/context/AuthContext";
import { cleanName } from "@/helpers/list";
import { shareText } from "@/helpers/share";
import { useGroups } from "@/hooks/useGroups";
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
    groups, membersOf, createGroup, isCreating, renameGroup, leaveGroup, removeMember, deleteGroup, createInvite,
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
      await shareText(t("groups.shareMessage", { group: group.name, code }));
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
          userId={user.id}
          onRename={(newName) => run(() => renameGroup(group, newName))}
          onInvite={() => handleInvite(group)}
          onRemoveMember={(userId) => run(() => removeMember(group, userId))}
          onLeave={() => run(() => leaveGroup(group))}
          onDelete={() => run(() => deleteGroup(group))}
        />
      ))}

      {invite && (
        <Text selectable style={styles.invite}>
          {t("groups.inviteCode", { group: invite.group, code: invite.code })}
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
      padding: 16,
      gap: 16,
    },
    addRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
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
