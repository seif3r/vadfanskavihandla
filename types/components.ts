import { StyleProp, TextStyle } from "react-native";

import { Category, Item, ShoppingList } from "@/types/models";

export interface ButtonProps {
  value: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  // Less padding and smaller text, always one line: for several buttons sharing a row.
  compact?: boolean;
}

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  style?: StyleProp<TextStyle>;
}

export interface ItemRowProps {
  item: Item;
  onToggle: () => void;
  // The first row in a card has no divider line above it.
  isFirst?: boolean;
}

export interface ListTabsProps {
  lists: ShoppingList[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  onManage: () => void;
}

export interface ItemSectionProps {
  items: Item[];
  onToggle: (itemId: string) => void;
}

export interface ListActionsProps {
  items: Item[];
  onCheckAll: () => void;
  onUncheckAll: () => void;
  onRemoveChecked: () => void;
}

export interface PickerOption<T extends string> {
  value: T;
  label: string;
}

export interface OptionPickerProps<T extends string> {
  options: PickerOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  // Read out by screen readers, since the icon itself has no words.
  accessibilityLabel: string;
  active?: boolean;
}

export interface AddItemOptionsProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  category: Category | undefined;
  onCategoryChange: (category: Category | undefined) => void;
}

export interface SettingSwitchProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  // The first row in a group has no divider line above it.
  isFirst?: boolean;
}

export interface ListRowProps {
  list: ShoppingList;
  onDelete: () => void;
  isFirst?: boolean;
}

export type IconName = "edit" | "more" | "check";

export interface IconProps {
  name: IconName;
  color: string;
  // Width and height in px.
  size?: number;
  // Line thickness. 2 is the normal weight; higher is bolder.
  strokeWidth?: number;
}
