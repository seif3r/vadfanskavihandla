// The user's settings, stored on their private user document.
import { toUser } from "@/api/auth";
import { db } from "@/api/firebase";
import { User, UserSettings } from "@/types/models";
import { doc, getDoc, updateDoc } from "firebase/firestore";
// Saves the given settings and returns the updated user. Each one is written by its own
// field path, so the others are kept, and a setting that is a map (notifications) is
// replaced whole: keys from an older shape are dropped instead of merged in, which
// firestore.rules would reject.
export async function updateSettings(userId: string, settings: Partial<UserSettings>): Promise<User> {
  const ref = doc(db, "users", userId);
  const fields = Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [`settings.${key}`, value]),
  );
  await updateDoc(ref, fields);
  return toUser(await getDoc(ref));
}
