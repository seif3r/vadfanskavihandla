// The Firebase app, auth and Firestore instances the rest of api/ uses.
// Nothing outside api/ imports from firebase/*.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { ApiError } from "@/api/ApiError";
import * as firebaseAuth from "firebase/auth";
import { Auth, connectAuthEmulator, getAuth, initializeAuth, Persistence } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";
import { Platform } from "react-native";

// Exported by the React Native build of firebase/auth but missing from its types. Read here rather
// than with @ts-expect-error on an import, which "organize imports" on save can separate from it.
const { getReactNativePersistence } = firebaseAuth as unknown as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};
// Fast Refresh re-runs this file; initializing twice throws.
const isFirstLoad = getApps().length === 0;
const app = isFirstLoad
  ? initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  })
  : getApp();
// The browser keeps the session by itself; on phones it's stored in AsyncStorage.
export const auth: Auth =
  Platform.OS === "web" || !isFirstLoad
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
// Optional fields like amount are undefined, which Firestore rejects unless told to skip them.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
if (emulatorHost && isFirstLoad) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
  connectFirestoreEmulator(db, emulatorHost, 8080);
}
// The logged-in user's id, for queries that only make sense for "me".
export function currentUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ApiError("errors.invalidSession");
  return uid;
}

// Maps Firebase error codes to the app's translated error keys.
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  switch ((error as { code?: string }).code) {
    case "auth/invalid-credential":
    case "auth/invalid-email":
      return new ApiError("errors.invalidCredentials");
    case "auth/email-already-in-use":
      return new ApiError("errors.emailInUse");
    case "auth/weak-password":
      return new ApiError("errors.weakPassword");
    case "permission-denied":
      return new ApiError("errors.notAllowed");
    case "unavailable":
    case "auth/network-request-failed":
      return new ApiError("errors.offline");
    default:
      return new ApiError("errors.unknown");
  }
}