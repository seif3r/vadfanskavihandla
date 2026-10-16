// The shopping lists the logged-in user is a member of.
import { ApiError } from "@/api/ApiError";
import { currentUid, db, toApiError } from "@/api/firebase";
import { ShoppingList } from "@/types/models";
import {
    addDoc, arrayUnion, collection, doc, getDoc, getDocs,
    onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, writeBatch,
} from "firebase/firestore";
const myListsQuery = (uid: string) => query(collection(db, "lists"), where("members", "array-contains", uid), orderBy("createdAt"));
export async function getLists(): Promise<ShoppingList[]> {
    const snap = await getDocs(myListsQuery(currentUid()));
    return snap.docs.map((d) => ({ id: d.id, name: d.data().name }));
}
export async function createList(name: string): Promise<ShoppingList> {
    const uid = currentUid();
    const ref = await addDoc(collection(db, "lists"), {
        name,
        ownerId: uid,
        members: [uid],
        createdAt: serverTimestamp(),
    });
    return { id: ref.id, name };
}
// Deletes the list together with all its items. Firestore has no cascading
// deletes, so the items go in the same batch (max 500 writes: plenty for a list).
export async function deleteList(listId: string): Promise<void> {
    const list = await getDoc(doc(db, "lists", listId));
    if (!list.exists()) throw new ApiError("errors.listNotFound");
    const items = await getDocs(query(collection(db, "items"), where("listId", "==", listId)));
    const batch = writeBatch(db);
    items.docs.forEach((item) => batch.delete(item.ref));
    batch.delete(list.ref);
    await batch.commit();
}
// New: creates a code others can use to join the list. The document id is the code.
export async function createInvite(listId: string, listName: string): Promise<string> {
    try {
        const ref = await addDoc(collection(db, "invites"), {
            listId,
            listName,
            createdBy: currentUid(),
            createdAt: serverTimestamp(),
        });
        return ref.id;
    } catch (error) {
        throw toApiError(error);
    }
}
// New: joins the list an invite code points to.
export async function acceptInvite(code: string): Promise<ShoppingList> {
    try {
        const invite = await getDoc(doc(db, "invites", code.trim()));
        if (!invite.exists()) throw new ApiError("errors.inviteNotFound");
        const { listId, listName } = invite.data();
        const list: ShoppingList = { id: listId, name: listName };
        // Readable only by members: if this works, I'm already in the list. Joining again would
        // be rejected by the rules, since it wouldn't add anyone.
        const existing = await getDoc(doc(db, "lists", listId)).catch(() => null);
        if (existing?.exists()) return list;
        // The rules check that this adds exactly me, with a valid invite for this list.
        await updateDoc(doc(db, "lists", listId), { members: arrayUnion(currentUid()), invite: invite.id });
        return list;
    } catch (error) {
        throw toApiError(error);
    }
}

// Calls onChange with my lists whenever one is created, renamed, deleted, or I'm added to one.
// Returns a function that stops listening.
export function subscribeToLists(userId: string, onChange: (lists: ShoppingList[]) => void): () => void {
    return onSnapshot(
        myListsQuery(userId),
        (snap) => onChange(snap.docs.map((d) => ({ id: d.id, name: d.data().name }))),
        // Denied for a moment while logging out; the listener is stopped right after.
        () => {},
    );
}
