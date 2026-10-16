// The people the user shares lists with.
import { currentUid, db } from "@/api/firebase";
import { Member } from "@/types/models";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
// Everyone who shares at least one list with me. Used to put names on notifications.
export async function getUsers(): Promise<Member[]> {
    const lists = await getDocs(
        query(collection(db, "lists"), where("members", "array-contains", currentUid())),
    );
    const ids = [...new Set(lists.docs.flatMap((list) => list.data().members as string[]))];
    const profiles = await Promise.all(ids.map((id) => getDoc(doc(db, "profiles", id))));
    return profiles
        .filter((profile) => profile.exists())
        .map((profile) => ({ id: profile.id, name: profile.data()!.name }));
}