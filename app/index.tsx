import { useHeaderHeight } from "expo-router/react-navigation";
import { useRouter } from "expo-router";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import ErrorText from "@/components/ErrorText";
import AddItemOptions from "@/components/AddItemOptions";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import Input from "@/components/Input";
import ItemSection from "@/components/ItemSection";
import ListActions from "@/components/ListActions";
import ListButton from "@/components/ListButton";
import LoadError from "@/components/LoadError";
import { spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { MAX_NAME_LENGTH } from "@/constants/limits";
import { cleanName, sortItems } from "@/helpers/list";
import { useItems } from "@/hooks/useItems";
import { useGroups } from "@/hooks/useGroups";
import { useActiveList } from "@/hooks/useActiveList";
import { useKnownItems } from "@/hooks/useKnownItems";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { useLiveStatus } from "@/context/LiveStatusContext";
import { Category, Item } from "@/types/models";
import { InputDraft } from "@/types/components";
import { ThemeColors } from "@/types/theme";

export default function Index() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const { activeList, isLoading, loadError, reload } = useActiveList();
  const liveError = useLiveStatus();
  const { groups } = useGroups();
  const {
    items, isLoading: isLoadingItems, addItem, isAdding, toggleItem, editItem, checkAll, uncheckAll, removeChecked,
    error,
  } = useItems(activeList?.id);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>();
  // Once the user picks a category themselves, typing no longer replaces it with a remembered one.
  const [isCategoryPicked, setIsCategoryPicked] = useState(false);
  const { categoryFor } = useKnownItems(activeList?.id);
  const [showOptions, setShowOptions] = useState(false);
  const sortedItems = sortItems(items);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardVisible();
  const inputRef = useRef<TextInput>(null);
  // The item being edited in the input bar, and what was typed there before, which comes back
  // when the edit is saved or cancelled.
  const [editing, setEditing] = useState<{ item: Item; draft: InputDraft } | null>(null);

  const fill = (draft: InputDraft) => {
    setText(draft.text);
    setAmount(draft.amount);
    setCategory(draft.category);
    setIsCategoryPicked(draft.isCategoryPicked);
    setShowOptions(draft.showOptions);
  };

  const startEdit = (item: Item) => {
    // The pen on the item being edited cancels.
    if (editing?.item.id === item.id) return stopEdit();
    const draft = editing?.draft ?? { text, amount, category, isCategoryPicked, showOptions };
    setEditing({ item, draft });
    // Its category counts as picked, so changing the name doesn't swap it for a remembered one.
    fill({ text: item.name, amount: item.amount ?? "", category: item.category, isCategoryPicked: true, showOptions: true });
    inputRef.current?.focus();
  };

  const stopEdit = () => {
    if (editing) fill(editing.draft);
    setEditing(null);
  };

  // Someone else removed the item, or another list was opened: nothing left to edit.
  const editingId = editing?.item.id;
  const isEditedItemGone = !!editingId && !items.some((item) => item.id === editingId);
  const onEditedItemGone = useEffectEvent(stopEdit);
  useEffect(() => {
    if (isEditedItemGone) onEditedItemGone();
  }, [isEditedItemGone]);

  const handleSave = () => {
    const name = cleanName(text);
    if (!editing || !name) return;
    editItem({ itemId: editing.item.id, name, amount: amount.trim() || undefined, category });
    stopEdit();
  };

  const handleAdd = () => {
    if (editing) return handleSave();
    const name = cleanName(text);
    if (!name) return;
    const draft = { text, amount, category };
    // Cleared right away so the next item can be typed (offline, the save isn't confirmed until
    // the connection is back). If the save fails, what was typed comes back, unless the field has
    // been filled in again since.
    addItem({ name, amount: amount.trim() || undefined, category }, () => {
      setText((current) => current || draft.text);
      setAmount((current) => current || draft.amount);
      setCategory((current) => current ?? draft.category);
    });
    setText("");
    setAmount("");
    setCategory(undefined);
    setIsCategoryPicked(false);
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (!isCategoryPicked) setCategory(categoryFor(value));
  };

  const handleCategoryChange = (value: Category | undefined) => {
    setCategory(value);
    setIsCategoryPicked(true);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!activeList && loadError) {
    return (
      <View style={[styles.container, styles.empty]}>
        <LoadError error={loadError} onRetry={reload} />
      </View>
    );
  }

  if (!activeList) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={styles.emptyText}>{t("list.empty")}</Text>
        <Button value={t("list.createFirst")} onPress={() => router.push("/lists")} />
      </View>
    );
  }

  return (
    // Lifts the input bar above the keyboard. Android needs it too: with edge-to-edge the window
    // no longer shrinks for the keyboard. The browser handles it on web.
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "web" ? undefined : "padding"}
      keyboardVerticalOffset={headerHeight}
    >
      <ListButton
        list={activeList}
        groupName={groups.find((group) => group.id === activeList.groupId)?.name}
        onPress={() => router.push("/lists")}
      />
      {liveError && (
        <ErrorText style={styles.liveError}>{t("list.notLive", { reason: t(liveError.key) })}</ErrorText>
      )}
      <ListActions
        items={items}
        onCheckAll={checkAll}
        onUncheckAll={uncheckAll}
        onRemoveChecked={removeChecked}
      />
      {/* "handled": checking off or editing works with the keyboard open, without a first tap
          that only closes it. */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {isLoadingItems ? (
          <ActivityIndicator />
        ) : (
          <ItemSection
            items={sortedItems}
            onToggle={toggleItem}
            onEdit={startEdit}
            editingId={editingId}
            emptyText={t("list.noItems")}
          />
        )}
      </ScrollView>
      {error && (
        <ErrorText style={styles.error}>{t(error.key)}</ErrorText>
      )}
      {editing && (
        <View style={styles.editBar}>
          <Text style={styles.editText} numberOfLines={1}>{t("list.editing", { name: editing.item.name })}</Text>
          <Button value={t("list.cancelEdit")} onPress={stopEdit} variant="secondary" />
        </View>
      )}
      {showOptions && (
        <AddItemOptions
          amount={amount}
          onAmountChange={setAmount}
          category={category}
          onCategoryChange={handleCategoryChange}
        />
      )}
      {/* Bottom inset keeps the bar clear of the home indicator / navigation bar, which the
          keyboard covers while it's open. */}
      <View
        style={[
          styles.inputBar,
          !showOptions && styles.inputBarBorder,
          { paddingBottom: spacing.lg + (isKeyboardVisible ? 0 : insets.bottom) },
        ]}
      >
        <Input
          ref={inputRef}
          value={text}
          onChangeText={handleTextChange}
          onSubmit={handleAdd}
          placeholder={t("list.addPlaceholder")}
          maxLength={MAX_NAME_LENGTH}
          autoCapitalize="sentences"
          style={styles.input}
        />
        <IconButton
          icon="more"
          onPress={() => setShowOptions(!showOptions)}
          accessibilityLabel={t("list.moreOptions")}
          active={showOptions}
        />
        <Button onPress={handleAdd} value={editing ? t("list.save") : t("list.add")} disabled={!editing && isAdding} />
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    empty: {
      gap: spacing.lg,
      padding: spacing.xl,
    },
    emptyText: {
      color: colors.textMuted,
    },
    error: {
      color: colors.danger,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    liveError: {
      color: colors.textMuted,
      textAlign: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    screen: {
      flex: 1,
    },
    inputBar: {
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.lg,
    },
    // The options panel draws its own top border when it's open.
    inputBarBorder: {
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    // Above the options panel while an item is edited, so it's clear the bar now edits.
    editBar: {
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    editText: {
      flex: 1,
      color: colors.primaryText,
      fontWeight: "600",
    },
    // Fills all width the button doesn't use.
    input: {
      flex: 1,
      minWidth: 0,
    },
    // Takes only the space left between the action bar and the input bar, and scrolls inside it.
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
    },
  });
