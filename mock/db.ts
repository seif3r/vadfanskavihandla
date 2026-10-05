// In-memory stand-in for the backend's database. Data resets when the app reloads.
import { ActivityEvent, Item, NotificationSettings, ShoppingList, User } from "@/types/models";

// Off by default: switching one on in Settings is what asks the device for permission.
const notificationsOff: NotificationSettings = { itemAdded: false, itemCompleted: false };

const users: User[] = [
  { id: "u1", name: "Anna", email: "anna@example.com", settings: { language: "sv", theme: "system", notifications: notificationsOff } },
  { id: "u2", name: "Erik", email: "erik@example.com", settings: { language: "en", theme: "system", notifications: notificationsOff } },
];

const lists: ShoppingList[] = [
  { id: "l1", name: "Veckohandling" },
  { id: "l2", name: "Bygghandeln" },
];

const items: Item[] = [
  { id: "i1", listId: "l1", name: "Mjölk", done: false, addedBy: "u1", amount: "2 l", category: "dairy" },
  { id: "i2", listId: "l1", name: "Bröd", done: true, addedBy: "u2", category: "bread" },
  { id: "i3", listId: "l1", name: "Ägg", done: false, addedBy: "u1", amount: "12 st", category: "dairy" },
  { id: "i4", listId: "l1", name: "Smör", done: false, addedBy: "u2", category: "dairy" },
  { id: "i5", listId: "l1", name: "Ost", done: true, addedBy: "u1", amount: "500 g", category: "dairy" },
  { id: "i6", listId: "l1", name: "Yoghurt", done: false, addedBy: "u2", amount: "1 l", category: "dairy" },
  { id: "i7", listId: "l1", name: "Bananer", done: false, addedBy: "u1", amount: "6 st", category: "produce" },
  { id: "i8", listId: "l1", name: "Äpplen", done: false, addedBy: "u2", amount: "1 kg", category: "produce" },
  { id: "i9", listId: "l1", name: "Tomater", done: true, addedBy: "u1", category: "produce" },
  { id: "i10", listId: "l1", name: "Gurka", done: false, addedBy: "u2", amount: "1 st", category: "produce" },
];

export const db = {
  users,
  lists,
  items,
  activity: [] as ActivityEvent[],
};

// Records what a user did, like a real backend would before sending push notifications.
export function recordActivity(event: Omit<ActivityEvent, "id">) {
  db.activity.push({ ...event, id: db.activity.length + 1 });
}
