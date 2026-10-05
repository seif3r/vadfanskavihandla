import { Language } from "@/types/i18n";
import { ThemePreference } from "@/types/theme";

// Which changes made by the other user you get notified about.
export interface NotificationSettings {
  itemAdded: boolean;
  itemCompleted: boolean;
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

export type ActivityType = "itemAdded" | "itemCompleted";

// Something a user did to a list. Notifications are made from these.
export interface ActivityEvent {
  // Increasing number, so "everything after event N" is easy to ask for.
  id: number;
  type: ActivityType;
  listId: string;
  itemName: string;
  userId: string;
}
