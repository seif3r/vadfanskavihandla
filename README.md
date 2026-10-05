# Vad fan ska vi handla

A shared shopping list app for two, built with Expo (React Native) and Expo Router.

## Get started

```bash
npm install
npm run web       # in the browser
npm run android   # in an Android emulator
npm start         # QR code for Expo Go on your phone
```

There is no backend yet: `api/` runs against an in-memory mock in `mock/` that resets on reload.
Log in with `anna@example.com` (Swedish) or `erik@example.com` (English), any password.
In dev mode, the other user is simulated and adds or checks off an item every 30 seconds, so
notifications can be tried on one device.

## Project structure

| Folder        | Contents                                                             |
| ------------- | -------------------------------------------------------------------- |
| `app/`        | Screens and routes (Expo Router). `_layout.tsx` sets up providers.   |
| `components/` | Reusable UI components                                               |
| `context/`    | `AuthContext` (logged-in user, settings) and `ListsContext` (lists)  |
| `hooks/`      | Data hooks built on TanStack Query, e.g. `useItems`                  |
| `api/`        | API calls the app uses. For now each file re-exports from `mock/api/`. |
| `mock/`       | Fake backend: in-memory data, network delay, activity simulator      |
| `types/`      | All interfaces and types                                             |
| `helpers/`    | Plain functions with no UI                                           |
| `i18n/`       | Translations. `locales/en.json` is the reference language.           |

## Translations

All UI text goes through `t("...")` from `react-i18next`. Keys are type-checked against
`i18n/locales/en.json`, and every other language file must contain the same keys.

## Connecting a real backend

1. Rewrite each file in `api/` to call the backend, keeping the same function names and types.
2. Remove the `startMockActivity` effect in `hooks/useActivityNotifications.ts`.
3. Delete `mock/`.
