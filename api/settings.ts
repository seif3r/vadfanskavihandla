// The user's settings, stored on their private user document.
import { toUser } from "@/api/auth";
import { db } from "@/api/firebase";
import { User, UserSettings } from "@/types/models";
import { doc, getDoc, setDoc } from "firebase/firestore";
// Saves the given settings and returns the updated user.
export async function updateSettings(userId: string, settings: Partial<UserSettings>): Promise<User> {
    const ref = doc(db, "users", userId);
    // merge: only the settings passed in change; the rest are kept.
    await setDoc(ref, { settings }, { merge: true });
    return toUser(await getDoc(ref));
}