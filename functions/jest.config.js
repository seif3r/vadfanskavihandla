// Tests for the functions, run against the Firestore emulator.
// Start them from the app folder: npm run test:functions
module.exports = {
  // tsconfig.dev.json adds the test folder and Jest's types.
  transform: {"^.+\\.ts$": ["ts-jest", {tsconfig: "tsconfig.dev.json"}]},
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  setupFiles: ["<rootDir>/test/setup.ts"],
  // The tests share one emulator database.
  maxWorkers: 1,
};
