// Which items the user has seen on each list: users/{uid}/seen/{listId}, one small document per
// list. Read with one listener for all lists; written at most once per list visit (useMarkSeen).
import { ApiError } from "@/api/ApiError";
import { db, isListenerFailure, toApiError, withApiError } from "@/api/firebase";
import { SeenState } from "@/types/models";
import {
  collection, doc, DocumentSnapshot, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc,
} from "firebase/firestore";

const seenCollection = (userId: string) => collection(db, "users", userId, "seen");

function toSeen(snap: DocumentSnapshot): SeenState {
  return {
    listId: snap.id,
    // Estimated until the server has saved a new document.
    since: snap.get("since", { serverTimestamps: "estimate" })?.toMillis() ?? Date.now(),
    itemIds: snap.get("itemIds") ?? [],
  };
}

const byList = (docs: DocumentSnapshot[]) =>
  Object.fromEntries(docs.map((d) => [d.id, toSeen(d)])) as Record<string, SeenState>;

export async function getSeen(userId: string): Promise<Record<string, SeenState>> {
  const snap = await withApiError(() => getDocs(seenCollection(userId)));
  return byList(snap.docs);
}

// Calls onChange with the user's seen state for every list whenever it changes (from any device).
// isFromServer is false while it only reflects the device's cache, where a list can look untracked
// although the server has it. Returns a function that stops listening.
export function subscribeToSeen(
  userId: string,
  onChange: (seen: Record<string, SeenState>, isFromServer: boolean) => void,
  onError?: (error: ApiError) => void,
): () => void {
  return onSnapshot(
    seenCollection(userId),
    (snap) => onChange(byList(snap.docs), !snap.metadata.fromCache),
    (error) => {
      if (isListenerFailure(error)) onError?.(toApiError(error));
    },
  );
}

// Starts keeping track for a list: everything on it now counts as seen, only what others add
// from now on is new.
export async function startSeen(userId: string, listId: string): Promise<void> {
  await withApiError(() =>
    setDoc(doc(seenCollection(userId), listId), { listId, since: serverTimestamp(), itemIds: [] }),
  );
}

// Replaces the list's seen ids (already pruned to the items still on it, see pruneSeen).
export async function saveSeen(userId: string, listId: string, itemIds: string[]): Promise<void> {
  await withApiError(() => updateDoc(doc(seenCollection(userId), listId), { itemIds }));
}
