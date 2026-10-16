// api/settings.ts
import { toUser } from "@/api/auth";
import { db } from "@/api/firebase";
import { User, UserSettings } from "@/types/models";
import { doc, getDoc, setDoc } from "firebase/firestore";
// Saves the given settings and returns the updated user.
export async function updateSettings(userId: string, settings: Partial<UserSettings>): Promise<User> {
    const ref = doc(db, "users", userId);
    // merge: only the settings passed in change, like the mock's spread.
    await setDoc(ref, { settings }, { merge: true });
    return toUser(await getDoc(ref));
}