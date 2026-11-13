# Vad fan ska vi handla

A shared shopping list app for households, built with Expo (React Native), Expo Router and Firebase.

## Get started

```bash
npm install
npm run web       # in the browser
npm run android   # in an Android emulator
npm start         # QR code for Expo Go on your phone
```

The backend is Firebase (Authentication, Cloud Firestore, and Cloud Functions for push). Put the project's web config in
`.env.local` as `EXPO_PUBLIC_FIREBASE_*` variables (see `api/firebase.ts`), then create an account
in the app. Lists belong to a group (`groups/{groupId}`, e.g. a household): everyone in the group
sees all its lists. Create a group or join one with an invite code from the Groups screen; a user
can be in several groups and sees the lists of all of them. The group's owner can rename it, remove
members, revoke invites and delete it. Joining goes through the `joinGroup` Cloud Function: a code works
for 7 days, while its creator is still a member, and not for someone the owner removed. The button at the top of the home screen shows the open list; tapping it
opens all lists, where you pick another one, add lists to a group or delete them. Changes show up
live on every device that has the list open.

Offline: in the browser, Firestore keeps its data in IndexedDB, so the lists open without a
connection and changes made offline are sent when it's back, even after a reload (logging out
clears it). On phones the cache is in memory: lists seen since the app started work offline, but
a phone that starts the app offline shows "Couldn't load" until it has a connection.

Each list remembers the category an item name last had (`lists/{listId}/knownItems`), so adding
"Äpple" again picks "Fruit & veg" by itself. Picking another category replaces what's remembered.

Members can be notified when someone adds or removes items (checking items off is personal and
notifies nobody). Each person's changes are bundled into one notification, sent 60 seconds after
their last change. See [docs/notifications.md](docs/notifications.md).

Deleting a group or list only deletes that document in the app; Cloud Functions delete what's
under it (lists, items, remembered categories, invites, pending notifications).

Security Rules and indexes live in `firestore.rules` and `firestore.indexes.json`. Besides
membership, the rules validate what's written: allowed fields, text lengths for items, amounts,
groups, lists and people's names (matching `constants/limits.ts`), allowed categories, and that items can only be checked or unchecked after
they're added:

```bash
firebase deploy --only firestore   # rules + indexes
firebase emulators:start           # local backend, set EXPO_PUBLIC_FIREBASE_EMULATOR_HOST (development builds only)
firebase deploy --only functions   # joining groups, push, cleanup (needs the Blaze plan)
```

App Check runs on web when `EXPO_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` holds a reCAPTCHA Enterprise site
key registered in the Firebase console. Don't turn on enforcement yet: phones have no App Check
provider (`api/appCheck.ts`), so enforcing it would lock them out.

## Tests

```bash
npm test                # helpers, components, and that limits match firestore.rules (Jest + jest-expo)
npm run test:rules      # Security Rules, against the Firestore emulator
npm run test:functions  # Cloud Functions (joinGroup, bundled push, cleanup), against the emulator
npm run test:all        # all three
```

The emulator tests start the Firestore emulator themselves (`firebase emulators:exec`, with the
`firebase-tools` dev dependency) under the `demo-vadfanskavihandla` project id, so they never touch
the real project. The emulator needs Java 21 or newer. Cloud Tasks and Expo's push service are
mocked in the function tests.

| Folder                         | Tests                                         |
| ------------------------------ | --------------------------------------------- |
| `helpers/__tests__/`, `constants/__tests__/`, `components/__tests__/` | App unit and component tests |
| `tests/rules/`                 | `firestore.rules`                             |
| `functions/test/`              | Cloud Functions                               |

GitHub Actions (`.github/workflows/ci.yml`) runs all of this on every pull request and push to
`main`: typecheck, lint and `npm test` for the app (including a test that `sv.json` has the same keys
and placeholders as `en.json`), lint and build for `functions/`, the emulator tests, a web and
Android export, and `expo-doctor` (advisory: it can fail without failing the run).

Every push to `main` also publishes the web app to GitHub Pages (`.github/workflows/deploy-web.yml`),
at `https://<owner>.github.io/vadfanskavihandla/`. It needs Pages set to "GitHub Actions" and the
`EXPO_PUBLIC_FIREBASE_*` values as repository variables, and the Pages domain listed under
Authorized domains in Firebase Authentication. `app.config.ts` sets the `/vadfanskavihandla` base
path only when `EXPO_BASE_URL` is set, so local development still runs at `/`.

## Project structure

| Folder        | Contents                                                             |
| ------------- | -------------------------------------------------------------------- |
| `app/`        | Screens and routes (Expo Router). `_layout.tsx` sets up providers.   |
| `components/` | Reusable UI components                                               |
| `context/`    | `AuthContext` (is someone logged in) and `ActiveListContext` (open list) |
| `hooks/`      | Data hooks built on TanStack Query (`useItems`) and live updates (`useLiveUpdates`) |
| `api/`        | The only code that talks to Firebase. `firebase.ts` sets up the client. |
| `functions/`  | Cloud Functions (push notifications), a separate Node project        |
| `types/`      | All interfaces and types                                             |
| `helpers/`    | Plain functions with no UI                                           |
| `i18n/`       | Translations. `locales/en.json` is the reference language.           |

## Translations

All UI text goes through `t("...")` from `react-i18next`. Keys are type-checked against
`i18n/locales/en.json`, and every other language file must contain the same keys.

## Backend

See `docs/backend-and-hosting-guide.pdf` for the Firebase setup, push notifications, EAS builds
and hosting the web version on GitHub Pages. Its push chapter predates bundled notifications;
`docs/notifications.md` describes how they work now.
