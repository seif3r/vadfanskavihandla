// Accounts and the current session.
import { ApiError } from "@/api/ApiError";
import { auth, db, toApiError } from "@/api/firebase";
import { LoginResponse } from "@/types/api";
import { User, UserSettings } from "@/types/models";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { doc, DocumentSnapshot, getDoc, writeBatch } from "firebase/firestore";
// New accounts start in Swedish with notifications off; turning one on asks for permission.
const defaultSettings: UserSettings = {
    language: "sv",
    theme: "system",
    notifications: { itemAdded: false, itemCompleted: false },
};
export const toUser = (snap: DocumentSnapshot): User => {
    const data = snap.data()!;
    return { id: snap.id, name: data.name, email: data.email, settings: data.settings };
};
async function loadUser(uid: string): Promise<User> {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) throw new ApiError("errors.invalidSession");
    return toUser(snap);
}
export async function login(email: string, password: string): Promise<LoginResponse> {
    try {
        const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
        return { token: await user.getIdToken(), user: await loadUser(user.uid) };
    } catch (error) {
        throw toApiError(error);
    }
}
// Firebase stores and refreshes the session itself. The token AuthContext saved only
// tells it that someone was logged in; wait for Firebase to restore that session.
export async function getCurrentUser(_token: string): Promise<User> {
    await auth.authStateReady();
    if (!auth.currentUser) throw new ApiError("errors.invalidSession");
    return loadUser(auth.currentUser.uid);
}
// New: creates the account plus its private user document and public profile.
export async function register(name: string, email: string, password: string): Promise<LoginResponse> {
    try {
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const profile: User = { id: user.uid, name, email: email.trim(), settings: defaultSettings };
        const batch = writeBatch(db);
        batch.set(doc(db, "users", user.uid), { name, email: profile.email, settings: defaultSettings });
        batch.set(doc(db, "profiles", user.uid), { name });
        await batch.commit();
        return { token: await user.getIdToken(), user: profile };
    } catch (error) {
        throw toApiError(error);
    }
}

// New: ends the Firebase session. AuthContext.logout must call it.
export async function logout(): Promise<void> {
    await signOut(auth);
}