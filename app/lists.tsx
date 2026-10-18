import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError } from "@/api/ApiError";

import Button from "@/components/Button";
import Input from "@/components/Input";
import ListRow from "@/components/ListRow";
import { MAX_LIST_NAME_LENGTH } from "@/constants/limits";
import { radius } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { useLists } from "@/context/ListsContext";
import { cleanName } from "@/helpers/list";
import { shareText } from "@/helpers/share";
import { ShoppingList } from "@/types/models";
import { ThemeColors } from "@/types/theme";

export default function Lists() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const { lists, createList, isCreatingList, deleteList, createInvite } = useLists();
  const [name, setName] = useState("");
  // The latest invite, also shown on screen: there's no share sheet in most desktop browsers.
  const [invite, setInvite] = useState<{ list: string; code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async (list: ShoppingList) => {
    setError(null);
    try {
      const code = await createInvite(list);
      setInvite({ list: list.name, code });
      await shareText(t("lists.shareMessage", { list: list.name, code }));
    } catch (e) {
      setError(t(e instanceof ApiError ? e.key : "errors.unknown"));
    }
  };

  const handleCreate = () => {
    const cleaned = cleanName(name);
    if (!cleaned) return;
    createList(cleaned);
    setName("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.addRow}>
        <Input
          value={name}
          onChangeText={setName}
          onSubmit={handleCreate}
          placeholder={t("lists.newPlaceholder")}
          maxLength={MAX_LIST_NAME_LENGTH}
          style={styles.input}
        />
        <Button value={t("lists.add")} onPress={handleCreate} disabled={isCreatingList} />
      </View>

      {lists.length > 0 ? (
        <View style={styles.group}>
          {lists.map((list, index) => (
            <ListRow
              key={list.id}
              list={list}
              onShare={() => handleShare(list)}
              onDelete={() => deleteList(list.id)}
              isFirst={index === 0}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>{t("list.empty")}</Text>
      )}

      {invite && (
        <Text selectable style={styles.invite}>
          {t("lists.inviteCode", { list: invite.list, code: invite.code })}
        </Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      <Button value={t("lists.join")} variant="secondary" onPress={() => router.push("/join")} />
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
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.large,
      borderWidth: 1,
      borderColor: colors.border,
    },
    empty: {
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
