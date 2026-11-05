// Groups: the people who shop together. Every member sees all of the group's lists.
import { ApiError } from "@/api/ApiError";
import { currentUid, db, functions, toApiError } from "@/api/firebase";
import { myGroupsQuery } from "@/api/queries";
import { INVITE_LIFETIME_DAYS } from "@/constants/limits";
import { JoinGroupRequest } from "@/types/api";
import { Group, Invite } from "@/types/models";
import {
  addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, DocumentData, getDocs,
  onSnapshot, query, QueryDocumentSnapshot, QuerySnapshot, serverTimestamp, updateDoc, where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

const INVITE_LIFETIME_MS = INVITE_LIFETIME_DAYS * 24 * 60 * 60 * 1000;

function toGroup(snap: QueryDocumentSnapshot<DocumentData>): Group {
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    ownerId: data.ownerId,
    memberIds: data.members,
    removedMemberIds: data.removedMembers ?? [],
  };
}
const invitesQuery = (groupId: string) => query(collection(db, "invites"), where("groupId", "==", groupId));
// The codes that still work, soonest to expire first. "estimate": a new code's createdAt isn't
// known until the server has answered.
function toActiveInvites(snap: QuerySnapshot<DocumentData>): Invite[] {
  return snap.docs
    .map((invite) => {
      const data = invite.data({ serverTimestamps: "estimate" });
      return {
        code: invite.id,
        createdBy: data.createdBy,
        expiresAt: (data.createdAt?.toMillis() ?? 0) + INVITE_LIFETIME_MS,
      };
    })
    .filter((invite) => invite.expiresAt > Date.now())
    .sort((a, b) => a.expiresAt - b.expiresAt);
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
  return { id: ref.id, name, ownerId: uid, memberIds: [uid], removedMemberIds: [] };
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
// Owner only. Remembers who was removed, so an invite code they still know can't bring them back.
export async function removeMember(groupId: string, userId: string): Promise<void> {
  await withApiError(() => updateDoc(doc(db, "groups", groupId), {
    members: arrayRemove(userId),
    removedMembers: arrayUnion(userId),
  }));
}
// Owner only. Lets someone who was removed join again, with a new invite.
export async function allowRemovedMember(groupId: string, userId: string): Promise<void> {
  await withApiError(() => updateDoc(doc(db, "groups", groupId), { removedMembers: arrayRemove(userId) }));
}
// Owner only. Its lists, their items and its invite codes are deleted by a Cloud Function
// (cleanUpGroup); until then the rules already hide them, since they look the group up.
export async function deleteGroup(groupId: string): Promise<void> {
  await withApiError(() => deleteDoc(doc(db, "groups", groupId)));
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
// Owner only: the group's invite codes that still work.
export async function getInvites(groupId: string): Promise<Invite[]> {
  return toActiveInvites(await withApiError(() => getDocs(invitesQuery(groupId))));
}
// The owner, or whoever created the code. It stops working right away.
export async function deleteInvite(code: string): Promise<void> {
  await withApiError(() => deleteDoc(doc(db, "invites", code)));
}
// Joins the group an invite code points to. The joinGroup Cloud Function checks the code.
export async function acceptInvite(code: string): Promise<void> {
  const joinGroup = httpsCallable<JoinGroupRequest, void>(functions, "joinGroup");
  await withApiError(() => joinGroup({ code: code.trim() }));
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

// Calls onChange with the group's working invite codes whenever one is created or deleted.
// Returns a function that stops listening.
export function subscribeToInvites(groupId: string, onChange: (invites: Invite[]) => void): () => void {
  return onSnapshot(
    invitesQuery(groupId),
    (snap) => onChange(toActiveInvites(snap)),
    // Denied once I'm no longer the owner; the screen then stops showing the codes.
    () => {},
  );
}
