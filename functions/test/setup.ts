/**
 * Runs before the function tests. They need the Firestore emulator
 * (npm run test:functions in the app starts it), and must never reach the
 * real project.
 */
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(
    "FIRESTORE_EMULATOR_HOST is not set. Run the tests with " +
    "`npm run test:functions` from the app folder.");
}
// A demo- project id never reaches a real Firebase project.
process.env.GCLOUD_PROJECT = "demo-vadfanskavihandla";
