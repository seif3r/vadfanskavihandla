import { ApiError } from "@/api/ApiError";
import { db, recordActivity } from "@/mock/db";
import { delay, response } from "@/mock/network";
import { AddItemRequest } from "@/types/api";
import { Item } from "@/types/models";

export async function getItems(listId: string): Promise<Item[]> {
  await delay();
  return response(db.items.filter((i) => i.listId === listId));
}

export async function addItem(request: AddItemRequest, userId: string): Promise<Item> {
  await delay();
  const item: Item = {
    id: String(Date.now()),
    listId: request.listId,
    name: request.name,
    done: false,
    addedBy: userId,
    amount: request.amount,
    category: request.category,
  };
  db.items.push(item);
  recordActivity({ type: "itemAdded", listId: item.listId, itemName: item.name, userId });
  return response(item);
}

export async function toggleItem(itemId: string, userId: string): Promise<Item> {
  await delay();
  const item = db.items.find((i) => i.id === itemId);
  if (!item) throw new ApiError("errors.itemNotFound");
  item.done = !item.done;
  if (item.done) recordActivity({ type: "itemCompleted", listId: item.listId, itemName: item.name, userId });
  return response(item);
}

export async function setAllDone(listId: string, done: boolean, userId: string): Promise<Item[]> {
  await delay();
  db.items
    .filter((i) => i.listId === listId && i.done !== done)
    .forEach((i) => {
      i.done = done;
      if (done) recordActivity({ type: "itemCompleted", listId, itemName: i.name, userId });
    });
  return response(db.items.filter((i) => i.listId === listId));
}

export async function removeDone(listId: string): Promise<void> {
  await delay();
  db.items = db.items.filter((i) => !(i.listId === listId && i.done));
}
