import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text } from "react-native";

import Button from "@/components/Button";
import GroupLists from "@/components/GroupLists";
import { useAuth } from "@/context/AuthContext";
import { useLists } from "@/context/ListsContext";
import { useGroups } from "@/hooks/useGroups";
import { useThemedStyles } from "@/hooks/useTheme";
import { Group, ShoppingList } from "@/types/models";
import { ThemeColors } from "@/types/theme";

// All lists, grouped by the group they belong to; tapping one opens it. A list is shared with
// everyone in its group.
export default function Lists() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { lists, activeList, setActiveListId, createList, isCreatingList, deleteList, error } = useLists();
  const { groups } = useGroups();

  // The list's creator and the group's owner may delete it; the rules check the same.
  const canDelete = (group: Group) => (list: ShoppingList) => list.ownerId === user?.id || group.ownerId === user?.id;

  // Opens the list on the home screen. Back if we came from there, so it isn't stacked twice.
  const handleSelect = (list: ShoppingList) => {
    setActiveListId(list.id);
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {groups.length === 0 && <Text style={styles.empty}>{t("lists.noGroups")}</Text>}

      {groups.map((group) => (
        <GroupLists
          key={group.id}
          group={group}
          lists={lists.filter((list) => list.groupId === group.id)}
          activeListId={activeList?.id}
          onSelect={handleSelect}
          canDelete={canDelete(group)}
          onCreate={(name) => createList(group.id, name)}
          onDelete={(list) => deleteList(list.id)}
          isCreating={isCreatingList}
        />
      ))}

      {error && <Text style={styles.error}>{t(error.key)}</Text>}

      <Button value={t("lists.manageGroups")} variant="secondary" onPress={() => router.push("/groups")} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: 16,
      gap: 24,
    },
    empty: {
      color: colors.textMuted,
      textAlign: "center",
    },
    error: {
      color: colors.danger,
      textAlign: "center",
    },
  });
