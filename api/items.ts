// Items on a shopping list.
import { ApiError } from "@/api/ApiError";
import { currentUid, db } from "@/api/firebase";
import { itemKey } from "@/helpers/list";
import { AddItemRequest } from "@/types/api";
import { Item, ItemChange, KnownItem } from "@/types/models";
import {
  collection, doc, DocumentSnapshot, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, writeBatch,
} from "firebase/firestore";
export const toItem = (snap: DocumentSnapshot): Item => {
  const data = snap.data()!;
  return {
    id: snap.id,
    listId: data.listId,
    name: data.name,
    done: data.done,
    addedBy: data.addedBy,
    amount: data.amount,
    category: data.category,
  };
};
// Oldest first: sortItems keeps that order within each category.
export const itemsQuery = (listId: string) =>
  query(collection(db, "items"), where("listId", "==", listId), orderBy("createdAt"));
export async function getItems(listId: string): Promise<Item[]> {
  const snap = await getDocs(itemsQuery(listId));
  return snap.docs.map(toItem);
}
// Also remembers the item's category for the list, in the same batch, so adding the
// same name later can suggest it. Adding without a category leaves what's remembered.
export async function addItem(request: AddItemRequest, userId: string): Promise<Item> {
  const ref = doc(collection(db, "items"));
  const batch = writeBatch(db);
  batch.set(ref, {
    ...request,
    done: false,
    addedBy: userId,
    updatedBy: userId,
    createdAt: serverTimestamp(),
  });
  if (request.category) {
    const known: KnownItem = { name: request.name, category: request.category };
    batch.set(doc(db, "lists", request.listId, "knownItems", itemKey(request.name)), known);
  }
  await batch.commit();
  return { ...request, id: ref.id, done: false, addedBy: userId };
}
// Every item name the list has a remembered category for.
export async function getKnownItems(listId: string): Promise<KnownItem[]> {
  const snap = await getDocs(collection(db, "lists", listId, "knownItems"));
  return snap.docs.map((d) => ({ name: d.data().name, category: d.data().category }));
}
export async function toggleItem(itemId: string, userId: string): Promise<Item> {
  const ref = doc(db, "items", itemId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new ApiError("errors.itemNotFound");
  const item = toItem(snap);
  await updateDoc(ref, { done: !item.done, updatedBy: userId });
  return { ...item, done: !item.done };
}
export async function setAllDone(listId: string, done: boolean, userId: string): Promise<Item[]> {
  const snap = await getDocs(itemsQuery(listId));
  const batch = writeBatch(db);
  snap.docs
    .filter((d) => d.data().done !== done)
    .forEach((d) => batch.update(d.ref, { done, updatedBy: userId }));
  await batch.commit();
  return snap.docs.map((d) => ({ ...toItem(d), done }));
}
// A deleted document can't say who deleted it, so the items are first stamped with my id.
// That way both notification paths name me: the listeners in subscribeToItems read updatedBy,
// and the Cloud Function reads the trigger's auth context. The stamp is its own commit so
// other people's listeners receive it before the removal.
export async function removeDone(listId: string): Promise<void> {
  const uid = currentUid();
  const snap = await getDocs(
    query(collection(db, "items"), where("listId", "==", listId), where("done", "==", true)),
  );
  const toStamp = snap.docs.filter((d) => d.data().updatedBy !== uid);
  if (toStamp.length > 0) {
    const stamp = writeBatch(db);
    toStamp.forEach((d) => stamp.update(d.ref, { updatedBy: uid }));
    await stamp.commit();
  }
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// Calls onChange with the list's items whenever anyone changes them, plus what other
// people just did (for notifications). Returns a function that stops listening.
export function subscribeToItems(
  listId: string,
  userId: string,
  onChange: (items: Item[], changes: ItemChange[]) => void,
): () => void {
  let isFirstSnapshot = true;
  return onSnapshot(itemsQuery(listId), (snap) => {
    // The first snapshot is everything already on the list, not news.
    // Checking items off is personal, so only adding and removing count.
    const changes = isFirstSnapshot
      ? []
      : snap.docChanges().flatMap((change): ItemChange[] => {
        const data = change.doc.data();
        const item = toItem(change.doc);
        if (change.type === "added" && data.updatedBy !== userId)
          return [{ type: "itemAdded", item, userId: data.updatedBy }];
        // removeDone stamps updatedBy before deleting, so it names whoever removed it.
        if (change.type === "removed" && data.updatedBy !== userId)
          return [{ type: "itemRemoved", item, userId: data.updatedBy }];
        return [];
      });
    isFirstSnapshot = false;
    onChange(snap.docs.map(toItem), changes);
  },
  // Denied once the list is deleted or I log out. The lists listener drops the list
  // and this listener is stopped, so there is nothing to do.
  () => {});
}
