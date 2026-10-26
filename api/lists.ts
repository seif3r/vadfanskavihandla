// The shopping lists in the logged-in user's groups.
import { ApiError } from "@/api/ApiError";
import { currentUid, db, toApiError } from "@/api/firebase";
import { groupListsQuery, myGroupsQuery } from "@/api/queries";
import { ShoppingList } from "@/types/models";
import {
    addDoc, collection, doc, DocumentData, getDoc, getDocs,
    onSnapshot, query, QueryDocumentSnapshot, serverTimestamp, where, writeBatch,
} from "firebase/firestore";
function toList(snap: QueryDocumentSnapshot<DocumentData>): ShoppingList {
    const data = snap.data();
    return { id: snap.id, name: data.name, groupId: data.groupId, ownerId: data.ownerId };
}
// Lists of all my groups, group by group. Firestore can't join, so it's one query per group.
export async function getLists(): Promise<ShoppingList[]> {
    const groups = await getDocs(myGroupsQuery(currentUid()));
    const perGroup = await Promise.all(groups.docs.map((group) => getDocs(groupListsQuery(group.id))));
    return perGroup.flatMap((snap) => snap.docs.map(toList));
}
export async function createList(groupId: string, name: string): Promise<ShoppingList> {
    const uid = currentUid();
    try {
        const ref = await addDoc(collection(db, "lists"), {
            name,
            groupId,
            ownerId: uid,
            createdAt: serverTimestamp(),
        });
        return { id: ref.id, name, groupId, ownerId: uid };
    } catch (error) {
        throw toApiError(error);
    }
}
// Deletes the list together with all its items and remembered categories. Firestore has
// no cascading deletes, so they go in the same batch (max 500 writes: plenty for a list).
export async function deleteList(listId: string): Promise<void> {
    try {
        const list = await getDoc(doc(db, "lists", listId));
        if (!list.exists()) throw new ApiError("errors.listNotFound");
        const items = await getDocs(query(collection(db, "items"), where("listId", "==", listId)));
        const knownItems = await getDocs(collection(db, "lists", listId, "knownItems"));
        const batch = writeBatch(db);
        items.docs.forEach((item) => batch.delete(item.ref));
        knownItems.docs.forEach((known) => batch.delete(known.ref));
        batch.delete(list.ref);
        await batch.commit();
    } catch (error) {
        throw toApiError(error);
    }
}

// Calls onChange with the lists of all my groups whenever a list is created, renamed or deleted,
// or I join or leave a group. Returns a function that stops listening.
export function subscribeToLists(userId: string, onChange: (lists: ShoppingList[]) => void): () => void {
    // One lists listener per group, started and stopped as my groups change.
    const listsByGroup = new Map<string, ShoppingList[]>();
    const stops = new Map<string, () => void>();
    let groupIds: string[] = [];
    // Waits until every group has answered, so a group that's still loading doesn't look empty.
    const emit = () => {
        if (groupIds.every((id) => listsByGroup.has(id))) onChange(groupIds.flatMap((id) => listsByGroup.get(id)!));
    };
    const stopGroups = onSnapshot(
        myGroupsQuery(userId),
        (snap) => {
            groupIds = snap.docs.map((group) => group.id);
            stops.forEach((stop, id) => {
                if (groupIds.includes(id)) return;
                stop();
                stops.delete(id);
                listsByGroup.delete(id);
            });
            groupIds.forEach((id) => {
                if (stops.has(id)) return;
                stops.set(id, onSnapshot(
                    groupListsQuery(id),
                    (lists) => {
                        listsByGroup.set(id, lists.docs.map(toList));
                        emit();
                    },
                    // Denied once I leave or am removed (the groups listener then stops this one),
                    // or the query fails. Counts as empty, so the other groups' lists still show.
                    () => {
                        listsByGroup.set(id, []);
                        emit();
                    },
                ));
            });
            emit();
        },
        // Denied for a moment while logging out; the listener is stopped right after.
        () => {},
    );
    return () => {
        stopGroups();
        stops.forEach((stop) => stop());
    };
}
