// The Firebase app, auth, Firestore and Functions instances the rest of api/ uses.
// Nothing outside api/ imports from firebase/*.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { ApiError } from "@/api/ApiError";
import { startAppCheck } from "@/api/appCheck";
import { EMULATOR_PORTS, FUNCTIONS_REGION } from "@/constants/firebase";
import * as firebaseAuth from "firebase/auth";
import { Auth, connectAuthEmulator, getAuth, initializeAuth, Persistence } from "firebase/auth";
import {
  clearIndexedDbPersistence, connectFirestoreEmulator, initializeFirestore, persistentLocalCache,
  persistentMultipleTabManager, terminate,
} from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
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
if (isFirstLoad) startAppCheck(app);
// The browser keeps the session by itself; on phones it's stored in AsyncStorage.
export const auth: Auth =
  Platform.OS === "web" || !isFirstLoad
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
// Optional fields like amount are undefined, which Firestore rejects unless told to skip them.
// In the browser, data is also kept in IndexedDB, so lists open without a connection (common in a
// store) and changes made offline are sent later, even after a reload. Phones have no IndexedDB, so
// there the cache is in memory and lasts until the app is closed. Static rendering (expo export)
// runs without a window, so it gets the memory cache too.
const isBrowser = Platform.OS === "web" && typeof window !== "undefined";
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  ...(isBrowser && { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }),
});
export const functions = getFunctions(app, FUNCTIONS_REGION);
const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
// Development only: a release build must never send passwords to a host over plain http.
if (__DEV__ && emulatorHost && isFirstLoad) {
  connectAuthEmulator(auth, `http://${emulatorHost}:${EMULATOR_PORTS.auth}`);
  connectFirestoreEmulator(db, emulatorHost, EMULATOR_PORTS.firestore);
  connectFunctionsEmulator(functions, emulatorHost, EMULATOR_PORTS.functions);
}
// Forgets the browser's cached data, so the next person to log in on this browser can't see the
// previous one's lists offline. Firestore can't be used again afterwards, so the page reloads.
// Does nothing on phones, whose cache is in memory.
export async function clearLocalCache(): Promise<void> {
  if (!isBrowser) return;
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } finally {
    window.location.reload();
  }
}

// The logged-in user's id, for queries that only make sense for "me".
export function currentUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ApiError("errors.invalidSession");
  return uid;
}

// Lives in its own file so it can be tested without starting Firebase; re-exported for api/.
export { isListenerFailure, toApiError, withApiError } from "@/api/errors";
