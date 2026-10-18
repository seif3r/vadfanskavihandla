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
in the app. Lists are shared with an invite code from the Lists screen. Changes show up live on
every device that has the list open.

Each list remembers the category an item name last had (`lists/{listId}/knownItems`), so adding
"Äpple" again picks "Fruit & veg" by itself. Picking another category replaces what's remembered.

Members can be notified when someone adds or removes items (checking items off is personal and
notifies nobody). Each person's changes are bundled into one notification, sent 60 seconds after
their last change. See [docs/notifications.md](docs/notifications.md).

Security Rules and indexes live in `firestore.rules` and `firestore.indexes.json`. Besides
membership, the rules validate what's written: allowed fields, text lengths for items, amounts,
lists and people's names (matching `constants/limits.ts`), allowed categories, and that items can only be checked or unchecked after
they're added:

```bash
firebase deploy --only firestore   # rules + indexes
firebase emulators:start           # local Auth/Firestore, set EXPO_PUBLIC_FIREBASE_EMULATOR_HOST
firebase deploy --only functions   # push notifications (needs the Blaze plan)
```

## Project structure

| Folder        | Contents                                                             |
| ------------- | -------------------------------------------------------------------- |
| `app/`        | Screens and routes (Expo Router). `_layout.tsx` sets up providers.   |
| `components/` | Reusable UI components                                               |
| `context/`    | `AuthContext` (logged-in user, settings) and `ListsContext` (lists)  |
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
