import { StyleSheet, View } from "react-native";
import { spacing } from "@/constants/theme";
import { useTranslation } from "react-i18next";

import Button from "@/components/Button";
import ConfirmButton from "@/components/ConfirmButton";
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
      {/* Deletes the checked items for everyone in the group, with no undo, so it asks first. */}
      <ConfirmButton
        label={t("list.removeChecked")}
        confirmLabel={t("list.confirmRemoveChecked")}
        onConfirm={onRemoveChecked}
        disabled={!hasChecked}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
