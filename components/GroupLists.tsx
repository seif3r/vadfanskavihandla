import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import Button from "@/components/Button";
import Input from "@/components/Input";
import ListRow from "@/components/ListRow";
import { MAX_LIST_NAME_LENGTH } from "@/constants/limits";
import { radius } from "@/constants/theme";
import { cleanName } from "@/helpers/list";
import { useThemedStyles } from "@/hooks/useTheme";
import { GroupListsProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// One group's lists under its name, with a field for adding a list to the group.
export default function GroupLists({
  group, lists, activeListId, onSelect, canDelete, onCreate, onDelete, isCreating,
}: GroupListsProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [name, setName] = useState("");

  const handleCreate = () => {
    const cleaned = cleanName(name);
    if (!cleaned) return;
    onCreate(cleaned);
    setName("");
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{group.name}</Text>
      {lists.length > 0 && (
        <View style={styles.card}>
          {lists.map((list, index) => (
            <ListRow
              key={list.id}
              list={list}
              isActive={list.id === activeListId}
              onPress={() => onSelect(list)}
              onDelete={canDelete(list) ? () => onDelete(list) : undefined}
              isFirst={index === 0}
            />
          ))}
        </View>
      )}
      <View style={styles.addRow}>
        <Input
          value={name}
          onChangeText={setName}
          onSubmit={handleCreate}
          placeholder={t("lists.newPlaceholder")}
          maxLength={MAX_LIST_NAME_LENGTH}
          style={styles.input}
        />
        <Button value={t("lists.add")} onPress={handleCreate} disabled={isCreating} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      gap: 8,
    },
    title: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      color: colors.textMuted,
      paddingHorizontal: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.large,
      borderWidth: 1,
      borderColor: colors.border,
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
  });
