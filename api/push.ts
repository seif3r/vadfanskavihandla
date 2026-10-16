// Where this device can receive push notifications. The Cloud Function in functions/
// reads these to notify the other members of a list.
import { db } from "@/api/firebase";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Platform } from "react-native";

// The token is the document id, so registering the same device twice is harmless.
export async function savePushToken(userId: string, token: string): Promise<void> {
  await setDoc(doc(db, "users", userId, "pushTokens", token), {
    platform: Platform.OS,
    updatedAt: serverTimestamp(),
  });
}

export async function removePushToken(userId: string, token: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "pushTokens", token));
}
