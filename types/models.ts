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

export interface ShoppingList {
  id: string;
  name: string;
}

// Store sections. The labels come from the "categories" translations.
export type Category =
  | "produce"
  | "dairy"
  | "meat"
  | "bread"
  | "pantry"
  | "frozen"
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
}

// Someone who shares at least one list with the user. Only the name is visible to others.
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
  // Item id to name, so the same item changed twice counts once.
  items: Map<string, string>;
  timer: ReturnType<typeof setTimeout> | undefined;
}
