import { useHeaderHeight } from "expo-router/react-navigation";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import AddItemOptions from "@/components/AddItemOptions";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import Input from "@/components/Input";
import ItemSection from "@/components/ItemSection";
import ListActions from "@/components/ListActions";
import ListButton from "@/components/ListButton";
import { spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { MAX_NAME_LENGTH } from "@/constants/limits";
import { cleanName, sortItems } from "@/helpers/list";
import { useItems } from "@/hooks/useItems";
import { useGroups } from "@/hooks/useGroups";
import { useActiveList } from "@/hooks/useActiveList";
import { useKnownItems } from "@/hooks/useKnownItems";
import { Category } from "@/types/models";
import { ThemeColors } from "@/types/theme";

export default function Index() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const { activeList, isLoading } = useActiveList();
  const { groups } = useGroups();
  const {
    items, isLoading: isLoadingItems, addItem, isAdding, toggleItem, checkAll, uncheckAll, removeChecked, error,
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

  const handleAdd = () => {
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

  if (!activeList) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={styles.emptyText}>{t("list.empty")}</Text>
        <Button value={t("list.createFirst")} onPress={() => router.push("/lists")} />
      </View>
    );
  }

  return (
    // Lifts the input bar above the keyboard on iOS; Android does this by itself.
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ListButton
        list={activeList}
        groupName={groups.find((group) => group.id === activeList.groupId)?.name}
        onPress={() => router.push("/lists")}
      />
      <ListActions
        items={items}
        onCheckAll={checkAll}
        onUncheckAll={uncheckAll}
        onRemoveChecked={removeChecked}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isLoadingItems ? (
          <ActivityIndicator />
        ) : (
          <ItemSection items={sortedItems} onToggle={toggleItem} />
        )}
      </ScrollView>
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite" role="alert">
          {t(error.key)}
        </Text>
      )}
      {showOptions && (
        <AddItemOptions
          amount={amount}
          onAmountChange={setAmount}
          category={category}
          onCategoryChange={handleCategoryChange}
        />
      )}
      {/* Bottom inset keeps the bar clear of the home indicator / navigation bar. */}
      <View style={[styles.inputBar, !showOptions && styles.inputBarBorder, { paddingBottom: spacing.lg + insets.bottom }]}>
        <Input
          value={text}
          onChangeText={handleTextChange}
          onSubmit={handleAdd}
          placeholder={t("list.addPlaceholder")}
          maxLength={MAX_NAME_LENGTH}
          style={styles.input}
        />
        <IconButton
          icon="more"
          onPress={() => setShowOptions(!showOptions)}
          accessibilityLabel={t("list.moreOptions")}
          active={showOptions}
        />
        <Button onPress={handleAdd} value={t("list.add")} disabled={isAdding} />
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
