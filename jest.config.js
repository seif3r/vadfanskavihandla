// Two kinds of tests:
// - "app": helpers, components and constants, with the Expo preset. `npm test` runs these.
// - "rules": Firestore Security Rules against the emulator. `npm run test:rules` starts the
//   emulator and runs these.
// The Cloud Functions have their own tests in functions/ (npm run test:functions).
module.exports = {
  projects: [
    {
      displayName: "app",
      preset: "jest-expo",
      testPathIgnorePatterns: ["/node_modules/", "<rootDir>/tests/rules/", "<rootDir>/functions/"],
    },
    {
      displayName: "rules",
      // Plain Node: the Expo preset replaces fetch, which the emulator client needs.
      testEnvironment: "node",
      transform: { "\\.ts$": ["babel-jest", { presets: ["babel-preset-expo"] }] },
      roots: ["<rootDir>/tests/rules"],
    },
  ],
};
