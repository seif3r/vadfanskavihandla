// Accounts and the current session.
import { ApiError } from "@/api/ApiError";
import { auth, db, toApiError, withApiError } from "@/api/firebase";
import { User, UserSettings } from "@/types/models";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { doc, DocumentSnapshot, getDoc, writeBatch } from "firebase/firestore";
// New accounts start in Swedish with notifications off; turning one on asks for permission.
const defaultSettings: UserSettings = {
  language: "sv",
  theme: "system",
  notifications: { itemAdded: false, itemRemoved: false },
};
export const toUser = (snap: DocumentSnapshot): User => {
  const data = snap.data()!;
  // Spelled out so accounts saved before a setting existed get it as off, and old keys are dropped.
  const notifications = data.settings?.notifications ?? {};
  const settings: UserSettings = {
    ...data.settings,
    notifications: { itemAdded: !!notifications.itemAdded, itemRemoved: !!notifications.itemRemoved },
  };
  return { id: snap.id, name: data.name, email: data.email, settings };
};
async function loadUser(uid: string): Promise<User> {
  const snap = await withApiError(() => getDoc(doc(db, "users", uid)));
  if (!snap.exists()) throw new ApiError("errors.invalidSession");
  return toUser(snap);
}
export async function login(email: string, password: string): Promise<User> {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
    return await loadUser(user.uid);
  } catch (error) {
    throw toApiError(error);
  }
}
// Firebase stores and refreshes the session itself (localStorage/IndexedDB on web, AsyncStorage
// on phones; see api/firebase.ts). On startup this waits until it has been restored.
export async function hasSession(): Promise<boolean> {
  await auth.authStateReady();
  return !!auth.currentUser;
}
export async function loadCurrentUser(): Promise<User> {
  await auth.authStateReady();
  if (!auth.currentUser) throw new ApiError("errors.invalidSession");
  return loadUser(auth.currentUser.uid);
}
// Creates the account plus its private user document and public profile.
export async function register(name: string, email: string, password: string): Promise<User> {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const profile: User = { id: user.uid, name, email: email.trim(), settings: defaultSettings };
    const batch = writeBatch(db);
    batch.set(doc(db, "users", user.uid), { name, email: profile.email, settings: defaultSettings });
    batch.set(doc(db, "profiles", user.uid), { name });
    await batch.commit();
    return profile;
  } catch (error) {
    throw toApiError(error);
  }
}

// Firebase only lets a recent login change the password, so this logs in again with the current
// one first. That also proves it's the account's owner and not someone at an unlocked phone.
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user?.email) throw new ApiError("errors.invalidSession");
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  } catch (error) {
    const code = (error as { code?: string }).code;
    // The email is known here, so a rejected credential can only mean the password.
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
      throw new ApiError("errors.wrongPassword");
    }
    throw toApiError(error);
  }
  try {
    await updatePassword(user, newPassword);
  } catch (error) {
    throw toApiError(error);
  }
}

// Ends the Firebase session, including the one it has stored on the device.
export async function logout(): Promise<void> {
  await withApiError(() => signOut(auth));
}