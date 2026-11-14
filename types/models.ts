import { Language } from "@/types/i18n";
import { ThemePreference } from "@/types/theme";

// Which changes made by the other user you get notified about.
export interface NotificationSettings {
  itemAdded: boolean;
  itemRemoved: boolean;
}

export interface UserSettings {
  language: Language;
  theme: ThemePreference;
  notifications: NotificationSettings;
}

export interface User {
  id: string;
  name: string;
  email: string;
  settings: UserSettings;
}

// People who shop together. Every member sees all of the group's lists.
export interface Group {
  id: string;
  // Empty for a personal group, which shows the translated "My lists" instead (groupName).
  name: string;
  // The user's own "My lists": only them in it, never shared, renamed or deleted.
  isPersonal: boolean;
  // Can rename the group, remove members and delete it.
  ownerId: string;
  memberIds: string[];
  // Removed by the owner: can't join again until the owner allows it.
  removedMemberIds: string[];
}

// A code that lets someone join a group.
export interface Invite {
  code: string;
  createdBy: string;
  // Milliseconds since 1970.
  expiresAt: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  groupId: string;
  // Whoever created it. They and the group's owner may delete it.
  ownerId: string;
}

// Store sections. The labels come from the "categories" translations.
export type Category =
  | "produce"
  | "dairy"
  | "meat"
  | "bread"
  | "pantry"
  | "frozen"
  | "baby"
  | "drinks"
  | "household"
  | "other";

// What a list remembers about an item name, so the next "Äpple" gets the same category.
export interface KnownItem {
  name: string;
  category: Category;
}

export interface Item {
  id: string;
  listId: string;
  name: string;
  done: boolean;
  addedBy: string;
  // Free text, so it can carry a unit: "2 l", "500 g", "3 st".
  amount?: string;
  category?: Category;
  // Milliseconds. Estimated by the device until the server has saved a new item.
  createdAt?: number;
}

// Which of a list's items the user has seen (users/{uid}/seen/{listId}). Items added by others
// after `since` that aren't in itemIds are new to them.
export interface SeenState {
  listId: string;
  // Milliseconds: when the app started keeping track for this list.
  since: number;
  itemIds: string[];
}

// What the list overview shows for a list.
export interface ListCount {
  // All items, checked off or not.
  total: number;
  // Added by others and not seen yet (unseenItems).
  unseen: number;
}

// Someone in at least one of the user's groups. Only the name is visible to others.
export interface Member {
  id: string;
  name: string;
}

export type ActivityType = "itemAdded" | "itemRemoved";

// Something another member just did to an item, seen through a live listener.
export interface ItemChange {
  type: ActivityType;
  item: Item;
  userId: string;
}

// One person's changes to one list, collected before they're shown as a single notification.
export interface PendingNotification {
  listId: string;
  userId: string;
  type: ActivityType;
  // A set, so the same item changed twice counts once.
  itemIds: Set<string>;
  timer: ReturnType<typeof setTimeout> | undefined;
}
