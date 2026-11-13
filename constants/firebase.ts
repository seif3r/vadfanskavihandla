// Where the app finds the backend. Each is also written elsewhere; constants/__tests__/limits.test.ts
// fails when they drift apart.

// Where the Cloud Functions run (region in functions/src/index.ts). If they move, joinGroup and
// deleteAccount stop being found until this changes too.
export const FUNCTIONS_REGION = "europe-north1";

// The local emulators, used in development when EXPO_PUBLIC_FIREBASE_EMULATOR_HOST is set. The
// same ports are set under "emulators" in firebase.json.
export const EMULATOR_PORTS = { auth: 9099, firestore: 8080, functions: 5001 };
