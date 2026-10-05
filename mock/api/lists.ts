import { ApiError } from "@/api/ApiError";
import { db } from "@/mock/db";
import { delay, response } from "@/mock/network";
import { ShoppingList } from "@/types/models";

export async function getLists(): Promise<ShoppingList[]> {
  await delay();
  return response(db.lists);
}

export async function createList(name: string): Promise<ShoppingList> {
  await delay();
  const list: ShoppingList = { id: `l${Date.now()}`, name };
  db.lists.push(list);
  return response(list);
}

// Deletes the list together with all its items.
export async function deleteList(listId: string): Promise<void> {
  await delay();
  if (!db.lists.some((l) => l.id === listId)) throw new ApiError("errors.listNotFound");
  db.lists = db.lists.filter((l) => l.id !== listId);
  db.items = db.items.filter((i) => i.listId !== listId);
}
