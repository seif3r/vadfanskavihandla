import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import Button from "@/components/Button";
import { ListActionsProps } from "@/types/components";

export default function ListActions({ items, onCheckAll, onUncheckAll, onRemoveChecked }: ListActionsProps) {
  const { t } = useTranslation();
  const hasUnchecked = items.some((item) => !item.done);
  const hasChecked = items.some((item) => item.done);

  // Each button is disabled when it would do nothing.
  return (
    <View style={styles.bar}>
      <Button value={t("list.checkAll")} variant="secondary" compact onPress={onCheckAll} disabled={!hasUnchecked} />
      <Button value={t("list.uncheckAll")} variant="secondary" compact onPress={onUncheckAll} disabled={!hasChecked} />
      <Button value={t("list.removeChecked")} variant="secondary" compact onPress={onRemoveChecked} disabled={!hasChecked} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
});
