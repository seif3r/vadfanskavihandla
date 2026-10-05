import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import Button from "@/components/Button";
import Input from "@/components/Input";
import ListRow from "@/components/ListRow";
import { radius } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { useLists } from "@/context/ListsContext";
import { cleanName } from "@/helpers/list";
import { ThemeColors } from "@/types/theme";

export default function Lists() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { lists, createList, isCreatingList, deleteList } = useLists();
  const [name, setName] = useState("");

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
          style={styles.input}
        />
        <Button value={t("lists.add")} onPress={handleCreate} disabled={isCreatingList} />
      </View>

      {lists.length > 0 ? (
        <View style={styles.group}>
          {lists.map((list, index) => (
            <ListRow key={list.id} list={list} onDelete={() => deleteList(list.id)} isFirst={index === 0} />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>{t("list.empty")}</Text>
      )}
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
  });
