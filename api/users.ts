// The people the user shares groups with.
import { currentUid, db, withApiError } from "@/api/firebase";
import { myGroupsQuery } from "@/api/queries";
import { Member } from "@/types/models";
import { doc, getDoc, getDocs } from "firebase/firestore";
// Everyone in at least one of my groups, me included, and those removed from them. Used to put
// names on notifications and members.
export async function getUsers(): Promise<Member[]> {
  return withApiError(async () => {
    const groups = await getDocs(myGroupsQuery(currentUid()));
    const ids = [...new Set(groups.docs.flatMap((group): string[] => [
      ...group.data().members,
      ...(group.data().removedMembers ?? []),
    ]))];
    const profiles = await Promise.all(ids.map((id) => getDoc(doc(db, "profiles", id))));
    return profiles
      .filter((profile) => profile.exists())
      .map((profile) => ({ id: profile.id, name: profile.data()!.name }));
  });
}
