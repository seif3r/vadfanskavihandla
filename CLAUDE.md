# Vad fan ska vi handla

## What this project is

A shared shopping list for a household. Two or more people share the same lists, see each
other's changes live, and get a notification when someone adds or checks off an item.

**The problem it solves:** "What do we need from the store?" lives in text messages, in someone's
head, or on a note on the fridge. Whoever is in the store doesn't know what the other person just
added, and things get bought twice or forgotten. This app gives a household one list that is
always up to date on every phone.

**Who can use it:** any household. Someone creates an account, creates a list and invites the
people they shop with. It is not hard-coded for one family.

**How it is delivered:**
- Web: static export (`npx expo export --platform web`) hosted on GitHub Pages.
- Android (and iOS later): builds made with EAS.
- Backend: Supabase (auth, Postgres, realtime, edge functions for push).

**Current state:** every screen works, but against an in-memory mock backend in `mock/`. The next
step is replacing the mock with Supabase, following `docs/backend-and-hosting-guide.pdf`.

## Tech stack and why

| Choice | Why |
| --- | --- |
| Expo + React Native + TypeScript | One codebase for Android, iOS and web. Expo handles builds (EAS) and native modules. |
| Expo Router | File-based routing in `app/`, same model on web and mobile. |
| TanStack Query | Server state: caching, refetching, optimistic updates, and later offline support. |
| i18next / react-i18next | The app is in Swedish and English from the start. |
| Supabase | Hosted Postgres with auth, row-level security and realtime. No server to run. |
| expo-notifications | Local and push notifications. |

## Architecture principles

- **`api/` is the only seam to the backend.** Screens, hooks and contexts call functions in
  `api/` and nothing else. Swapping the mock for Supabase means rewriting `api/` while keeping the
  same function names and types. No Supabase client calls outside `api/`.
- **All I/O happens in `api/` and `helpers/`.** Components only render and call hooks.
- **Server data goes through TanStack Query hooks** in `hooks/`. Contexts hold app state (logged-in
  user, current list), not copies of server data.
- **All types live in `types/`.** No inline interfaces in components.
- **Plain functions without UI go in `helpers/`.** Functions do one thing.
- **All UI text goes through `t("...")`.** `i18n/locales/en.json` is the reference; every locale
  has the same keys. Errors carry a translation key (`ApiError`), not a finished sentence.
- **Colours and spacing come from the theme** (`constants/theme.ts`, `useTheme`), never hard-coded.
- **Security lives in the database.** Every Supabase table has RLS so users only see lists they are
  members of. The client is never trusted.
- **Expo Go must keep working.** Native-only modules (like `expo-notifications`) are loaded through
  a helper that falls back gracefully, never imported at the top level of a screen or hook.
- Imports use the `@/` alias. Comments explain *why*, briefly.

## Before calling something done

- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- New UI text exists in both `en.json` and `sv.json`.
- The change works on web and in the Android emulator.

## Things the agent must NOT do

- Don't switch away from Supabase, Expo or TanStack Query, or add another state library.
- Don't add npm dependencies without asking first. Use `npx expo install` for Expo packages so
  versions match the SDK.
- Don't call the backend from components, contexts or hooks directly; go through `api/`.
- Don't change function names or signatures in `api/` without updating every caller and asking first.
- Don't commit secrets. Supabase keys go in `.env.local`, which is git-ignored. Never put the
  service role key in the app.
- Don't disable RLS or loosen policies to make something work.
- Don't delete `mock/` until every `api/` file has been moved to Supabase.
- Don't push, open PRs or deploy without being asked.
- Don't hard-code text in one language.
