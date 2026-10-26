// Groups: the people who shop together. Every member sees all of the group's lists.
import { ApiError } from "@/api/ApiError";
import { currentUid, db, toApiError } from "@/api/firebase";
import { deleteList } from "@/api/lists";
import { groupListsQuery, myGroupsQuery } from "@/api/queries";
import { Group } from "@/types/models";
import {
    addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, DocumentData, getDoc, getDocs,
    onSnapshot, QueryDocumentSnapshot, serverTimestamp, updateDoc,
} from "firebase/firestore";
function toGroup(snap: QueryDocumentSnapshot<DocumentData>): Group {
    const data = snap.data();
    return { id: snap.id, name: data.name, ownerId: data.ownerId, memberIds: data.members };
}
// Runs a Firestore call and turns Firebase errors into ApiErrors.
async function withApiError<T>(action: () => Promise<T>): Promise<T> {
    try {
        return await action();
    } catch (error) {
        throw toApiError(error);
    }
}
export async function getGroups(): Promise<Group[]> {
    const snap = await getDocs(myGroupsQuery(currentUid()));
    return snap.docs.map(toGroup);
}
export async function createGroup(name: string): Promise<Group> {
    const uid = currentUid();
    const ref = await withApiError(() => addDoc(collection(db, "groups"), {
        name,
        ownerId: uid,
        members: [uid],
        createdAt: serverTimestamp(),
    }));
    return { id: ref.id, name, ownerId: uid, memberIds: [uid] };
}
// Owner only.
export async function renameGroup(groupId: string, name: string): Promise<void> {
    await withApiError(() => updateDoc(doc(db, "groups", groupId), { name }));
}
// An owner who leaves hands the group to the longest-standing other member. The last
// member can't leave, only delete the group, so no group is left without an owner.
export async function leaveGroup(group: Group): Promise<void> {
    const uid = currentUid();
    const others = group.memberIds.filter((id) => id !== uid);
    if (others.length === 0) throw new ApiError("errors.lastMember");
    await withApiError(() => updateDoc(doc(db, "groups", group.id), {
        members: arrayRemove(uid),
        ...(group.ownerId === uid && { ownerId: others[0] }),
    }));
}
// Owner only.
export async function removeMember(groupId: string, userId: string): Promise<void> {
    await withApiError(() => updateDoc(doc(db, "groups", groupId), { members: arrayRemove(userId) }));
}
// Owner only. Deletes the group's lists (with their items) first: the rules for those
// look up the group, so it has to exist until they're gone.
export async function deleteGroup(groupId: string): Promise<void> {
    await withApiError(async () => {
        const lists = await getDocs(groupListsQuery(groupId));
        for (const list of lists.docs) await deleteList(list.id);
        await deleteDoc(doc(db, "groups", groupId));
    });
}
// Creates a code others can use to join the group. The document id is the code.
export async function createInvite(groupId: string, groupName: string): Promise<string> {
    const ref = await withApiError(() => addDoc(collection(db, "invites"), {
        groupId,
        groupName,
        createdBy: currentUid(),
        createdAt: serverTimestamp(),
    }));
    return ref.id;
}
// Joins the group an invite code points to.
export async function acceptInvite(code: string): Promise<void> {
    try {
        const invite = await getDoc(doc(db, "invites", code.trim()));
        // Codes made before groups existed point to a list instead.
        const groupId = invite.data()?.groupId;
        if (!groupId) throw new ApiError("errors.inviteNotFound");
        // Readable only by members: if this works, I'm already in the group. Joining again would
        // be rejected by the rules, since it wouldn't add anyone.
        const existing = await getDoc(doc(db, "groups", groupId)).catch(() => null);
        if (existing?.exists()) return;
        // The rules check that this adds exactly me, with a valid invite for this group.
        await updateDoc(doc(db, "groups", groupId), { members: arrayUnion(currentUid()), invite: invite.id });
    } catch (error) {
        // The group was deleted after the invite was made.
        if ((error as { code?: string }).code === "not-found") throw new ApiError("errors.inviteNotFound");
        throw toApiError(error);
    }
}

// Calls onChange with my groups whenever one is created, renamed or deleted, or its members
// change. Returns a function that stops listening.
export function subscribeToGroups(userId: string, onChange: (groups: Group[]) => void): () => void {
    return onSnapshot(
        myGroupsQuery(userId),
        (snap) => onChange(snap.docs.map(toGroup)),
        // Denied for a moment while logging out; the listener is stopped right after.
        () => {},
    );
}
