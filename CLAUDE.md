# Vad fan ska vi handla

## What this project is

A shared shopping list for a household. Two or more people share the same lists, see each
other's changes live, and get a notification when someone adds or removes items. Checking an item
off is personal and notifies nobody. A person's changes are bundled into one notification, sent
60 seconds after their last change ("Anna added 3 items: …").

**The problem it solves:** "What do we need from the store?" lives in text messages, in someone's
head, or on a note on the fridge. Whoever is in the store doesn't know what the other person just
added, and things get bought twice or forgotten. This app gives a household one list that is
always up to date on every phone.

**Who can use it:** any household. Someone creates an account, creates a list and invites the
people they shop with. It is not hard-coded for one family.

**How it is delivered:**
- Web: static export (`npx expo export --platform web`) hosted on GitHub Pages.
- Android (and iOS later): builds made with EAS.
- Backend: Firebase (Authentication, Cloud Firestore with realtime listeners, Cloud Functions +
  Cloud Tasks for bundled push via Expo's push service).

**Current state:** the app runs on Firebase; the mock backend is gone. `docs/backend-and-hosting-guide.pdf`
describes the setup, but its push chapter (8) is outdated: `docs/notifications.md` describes how
notifications work now.

## Tech stack and why

| Choice | Why |
| --- | --- |
| Expo + React Native + TypeScript | One codebase for Android, iOS and web. Expo handles builds (EAS) and native modules. |
| Expo Router | File-based routing in `app/`, same model on web and mobile. |
| TanStack Query | Server state: caching, refetching, optimistic updates, and later offline support. |
| i18next / react-i18next | The app is in Swedish and English from the start. |
| Firebase (JavaScript SDK) | Auth, Firestore, realtime listeners and Cloud Functions in one project. No server to run. The JS SDK (`firebase`), not `@react-native-firebase`, so Expo Go and web keep working. |
| expo-notifications | Local and push notifications. |

## Architecture principles

- **`api/` is the only seam to the backend.** Screens, hooks and contexts call functions in
  `api/` and nothing else. Nothing outside `api/` imports from `firebase/*`; live updates are
  exposed as subscribe functions in `api/`.
- **All I/O happens in `api/` and `helpers/`.** Components only render and call hooks.
- **Server data goes through TanStack Query hooks** in `hooks/`. Contexts hold app state (logged-in
  user, current list), not copies of server data.
- **All types live in `types/`.** No inline interfaces in components. `functions/` can't import
  the app's `types/`, so its types live in `functions/src/types.ts`.
- **Plain functions without UI go in `helpers/`.** Functions do one thing.
- **All UI text goes through `t("...")`.** `i18n/locales/en.json` is the reference; every locale
  has the same keys. Errors carry a translation key (`ApiError`), not a finished sentence.
- **Colours and spacing come from the theme** (`constants/theme.ts`, `useTheme`), never hard-coded.
- **Security lives in the database.** Firestore Security Rules (`firestore.rules`, in the repo and
  deployed with the Firebase CLI) make sure users only see lists they are members of. The Firebase
  config in the app is public by design; the client is never trusted.
- **The rules also validate data.** Text lengths (item names 100, amounts 30, list names 50, person
  names 50; all non-empty), allowed fields, and categories (the `Category` values) are checked in
  `firestore.rules`; the same limits live in `constants/limits.ts` for the inputs' `maxLength`. Changing a limit or adding a category means changing both.
  Items can only have `done`/`updatedBy` updated after creation, so a feature that edits items
  (rename, change category) needs a rule change first.
- **Expo Go must keep working.** Native-only modules (like `expo-notifications`) are loaded through
  a helper that falls back gracefully, never imported at the top level of a screen or hook.
- **Notifications have two paths that must behave the same.** Installed builds get push from the
  Cloud Function in `functions/`; web and Expo Go show them in-app from `hooks/useLiveUpdates.ts`.
  A change to what triggers a notification, its text or its timing goes in both.
- **`functions/` is a separate Node project** with Google-style lint (2-space indent, 80 columns,
  JSDoc). It reads notification texts from the app's locale files (copied in by its build script),
  so they are only translated in `i18n/locales/`.
- Imports use the `@/` alias. Comments explain *why*, briefly.

## Before calling something done

- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- If `functions/` changed: `npm run build` and `npm run lint` pass in `functions/`.
- New UI text exists in both `en.json` and `sv.json`.
- The change works on web and in the Android emulator.

## Things the agent must NOT do

- Don't switch away from Firebase, Expo or TanStack Query, or add another state library.
- Don't add npm dependencies without asking first. Use `npx expo install` for Expo packages so
  versions match the SDK.
- Don't call the backend from components, contexts or hooks directly; go through `api/`.
- Don't change function names or signatures in `api/` without updating every caller and asking first.
- Don't commit secrets. The Firebase config goes in `.env.local` (git-ignored) as `EXPO_PUBLIC_FIREBASE_*`.
  Never put a service account key in the app or the repo; it belongs only in EAS / Cloud Functions.
- Don't loosen Security Rules (e.g. `allow read, write: if true`) or use Firestore test mode to make
  something work.
- Don't push, open PRs or deploy without being asked.
- Don't hard-code text in one language.
