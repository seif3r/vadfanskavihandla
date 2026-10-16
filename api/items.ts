// Items on a shopping list.
import { ApiError } from "@/api/ApiError";
import { db } from "@/api/firebase";
import { AddItemRequest } from "@/types/api";
import { Item, ItemChange } from "@/types/models";
import {
    addDoc, collection, doc, DocumentSnapshot, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, writeBatch,
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
export async function addItem(request: AddItemRequest, userId: string): Promise<Item> {
    const ref = await addDoc(collection(db, "items"), {
        ...request,
        done: false,
        addedBy: userId,
        updatedBy: userId,
        createdAt: serverTimestamp(),
    });
    return { ...request, id: ref.id, done: false, addedBy: userId };
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
export async function removeDone(listId: string): Promise<void> {
    const snap = await getDocs(
        query(collection(db, "items"), where("listId", "==", listId), where("done", "==", true)),
    );
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
        const changes = isFirstSnapshot
            ? []
            : snap.docChanges().flatMap((change): ItemChange[] => {
                const data = change.doc.data();
                if (data.updatedBy === userId) return [];
                const item = toItem(change.doc);
                if (change.type === "added") return [{ type: "itemAdded", item, userId: data.updatedBy }];
                if (change.type === "modified" && data.done)
                    return [{ type: "itemCompleted", item, userId: data.updatedBy }];
                return [];
            });
        isFirstSnapshot = false;
        onChange(snap.docs.map(toItem), changes);
    },
    // Denied once the list is deleted or I log out. The lists listener drops the list
    // and this listener is stopped, so there is nothing to do.
    () => {});
}
