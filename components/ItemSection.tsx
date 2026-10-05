import { StyleSheet, View } from "react-native";

import ItemRow from "@/components/ItemRow";
import { radius } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { ItemSectionProps } from "@/types/components";
import { ThemeColors } from "@/types/theme";

// The items as one rounded card, with thin dividers between rows.
export default function ItemSection({ items, onToggle }: ItemSectionProps) {
  const styles = useThemedStyles(createStyles);
  if (items.length === 0) return null;

  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <ItemRow key={item.id} item={item} onToggle={() => onToggle(item.id)} isFirst={index === 0} />
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      borderRadius: radius.large,
      borderWidth: 1,
      borderColor: colors.border,
      // Clips the rows' backgrounds to the rounded corners.
      overflow: "hidden",
    },
  });
