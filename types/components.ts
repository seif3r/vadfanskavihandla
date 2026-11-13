import { ReactNode } from "react";
import { StyleProp, TextInputProps, TextStyle } from "react-native";

import { ApiError } from "@/api/ApiError";
import { Category, Group, Item, Member, ShoppingList } from "@/types/models";

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
  maxLength?: number;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  // So phones show the right keyboard and password managers can fill the field in.
  keyboardType?: TextInputProps["keyboardType"];
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  // "none" unless given: most fields are emails, codes and item names.
  autoCapitalize?: TextInputProps["autoCapitalize"];
}

export interface ErrorTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
}

export interface ItemRowProps {
  item: Item;
  onToggle: () => void;
  // The first row in a card has no divider line above it.
  isFirst?: boolean;
}

export interface ListButtonProps {
  list: ShoppingList;
  groupName?: string;
  onPress: () => void;
}

export interface ItemSectionProps {
  items: Item[];
  onToggle: (itemId: string) => void;
  // Shown when there are no items.
  emptyText?: string;
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
  // The list that's open on the home screen.
  isActive?: boolean;
  onPress?: () => void;
  // Left out when the user may not delete the list.
  onDelete?: () => void;
  isFirst?: boolean;
}

export interface AppErrorBoundaryProps {
  children: ReactNode;
}

export interface AppErrorBoundaryState {
  error: Error | null;
}

export interface CrashScreenProps {
  error: Error;
  // Renders the app again.
  retry: () => void;
}

export interface LoadErrorProps {
  error: ApiError;
  onRetry: () => void;
}

export interface ConfirmButtonProps {
  label: string;
  // Shown after the first tap, e.g. "Delete?".
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
}

export interface GroupListsProps {
  group: Group;
  lists: ShoppingList[];
  activeListId: string | undefined;
  onSelect: (list: ShoppingList) => void;
  // Whether the user may delete this list.
  canDelete: (list: ShoppingList) => boolean;
  onCreate: (name: string) => void;
  onDelete: (list: ShoppingList) => void;
  isCreating: boolean;
}

export interface GroupCardProps {
  group: Group;
  members: Member[];
  removedMembers: Member[];
  userId: string;
  onRename: (name: string) => void;
  onInvite: () => void;
  onRevokeInvite: (code: string) => void;
  onRemoveMember: (userId: string) => void;
  onAllowRemovedMember: (userId: string) => void;
  onLeave: () => void;
  onDelete: () => void;
}

export interface GroupInvitesProps {
  group: Group;
  onRevoke: (code: string) => void;
}

export type IconName = "edit" | "more" | "check" | "list" | "chevronRight";

export interface IconProps {
  name: IconName;
  color: string;
  // Width and height in px.
  size?: number;
  // Line thickness. 2 is the normal weight; higher is bolder.
  strokeWidth?: number;
}
