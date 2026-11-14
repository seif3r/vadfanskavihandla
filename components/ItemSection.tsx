import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import ItemRow from "@/components/ItemRow";
import { radius, spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { ItemSectionProps, RowLayout } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// The items as one rounded card, with thin dividers between rows.
export default function ItemSection({ items, onToggle, onEdit, editingId, emptyText, onRowsLayout }: ItemSectionProps) {
  const styles = useThemedStyles(createStyles);
  // Rows are laid out inside the card; adding the card's own position places them in the content.
  const cardY = useRef(0);
  const rows = useRef<Record<string, RowLayout>>({});
  const report = () => {
    const placed = Object.fromEntries(
      Object.entries(rows.current)
        .filter(([id]) => items.some((item) => item.id === id))
        .map(([id, row]) => [id, { y: cardY.current + row.y, height: row.height }]),
    );
    onRowsLayout?.(placed);
  };

  if (items.length === 0) return emptyText ? <Text style={styles.empty}>{emptyText}</Text> : null;

  return (
    <View
      style={styles.card}
      onLayout={(event) => {
        cardY.current = event.nativeEvent.layout.y;
        report();
      }}
    >
      {items.map((item, index) => (
        <ItemRow
          key={item.id}
          item={item}
          onToggle={() => onToggle(item.id)}
          onEdit={() => onEdit(item)}
          isEditing={item.id === editingId}
          isFirst={index === 0}
          onLayout={(layout) => {
            rows.current[item.id] = layout;
            report();
          }}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      marginHorizontal: spacing.xl,
      borderRadius: radius.large,
      borderWidth: 1,
      borderColor: colors.border,
      // Clips the rows' backgrounds to the rounded corners.
      overflow: "hidden",
    },
    empty: {
      color: colors.textMuted,
      textAlign: "center",
      marginHorizontal: spacing.xl,
    },
  });
