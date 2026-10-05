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
import ListTabs from "@/components/ListTabs";
import { useThemedStyles } from "@/hooks/useTheme";
import { useLists } from "@/context/ListsContext";
import { cleanName, sortItems } from "@/helpers/list";
import { useItems } from "@/hooks/useItems";
import { Category } from "@/types/models";
import { ThemeColors } from "@/types/theme";

export default function Index() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const { lists, activeList, setActiveListId, isLoading } = useLists();
  const { items, isLoading: isLoadingItems, addItem, isAdding, toggleItem, checkAll, uncheckAll, removeChecked } =
    useItems(activeList?.id);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>();
  const [showOptions, setShowOptions] = useState(false);
  const sortedItems = sortItems(items);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const handleAdd = () => {
    const name = cleanName(text);
    if (!name) return;
    addItem({ name, amount: amount.trim() || undefined, category });
    setText("");
    setAmount("");
    setCategory(undefined);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (lists.length === 0) {
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
      <ListTabs
        lists={lists}
        activeId={activeList?.id}
        onSelect={setActiveListId}
        onManage={() => router.push("/lists")}
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
      {showOptions && (
        <AddItemOptions
          amount={amount}
          onAmountChange={setAmount}
          category={category}
          onCategoryChange={setCategory}
        />
      )}
      {/* Bottom inset keeps the bar clear of the home indicator / navigation bar. */}
      <View style={[styles.inputBar, !showOptions && styles.inputBarBorder, { paddingBottom: 12 + insets.bottom }]}>
        <Input
          value={text}
          onChangeText={setText}
          onSubmit={handleAdd}
          placeholder={t("list.addPlaceholder")}
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
      gap: 12,
      padding: 16,
    },
    emptyText: {
      color: colors.textMuted,
    },
    screen: {
      flex: 1,
    },
    inputBar: {
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
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
      paddingTop: 16,
      paddingBottom: 16,
    },
  });
