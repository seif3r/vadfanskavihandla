# Setting up the backend, builds and hosting

How to run the app against your own Firebase project, build it for phones and publish the web
version. This replaces `backend-and-hosting-guide.pdf`, which describes an earlier stage (lists
shared per list instead of per group, push sent one change at a time); keep it only for history.

## 1. Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com). Google
   Analytics isn't needed.
2. **Authentication**: enable the Email/Password provider. Leave email enumeration protection on.
3. **Firestore**: create the database in production mode (never test mode) in a location close to
   you. This project uses `europe-north2` (Stockholm). The location can't be changed later.
4. **Project settings › Your apps › Add app › Web**. The values in its `firebaseConfig` go in
   `.env.local` (next section). The same web config is used on Android, iOS and web, since all three
   run the Firebase JavaScript SDK.
5. Cloud Functions needs the **Blaze** (pay-as-you-go) plan. Set a budget alert first; a household's
   use stays far inside the free quotas.

## 2. Local config

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run web
```

`.env.example` lists every variable. The app stops with "Firebase config missing" in development
if the API key or project id is empty. EAS builds and GitHub Actions don't see `.env.local`; see
sections 5 and 6.

## 3. Rules, indexes and functions

The Firebase CLI deploys everything from files in the repo:

```bash
npm install -g firebase-tools
firebase login
firebase use <project-id>
firebase deploy --only firestore,functions
```

- `firestore.rules` decides who may read and write what, and validates the data. Changes take
  effect only when deployed.
- `firestore.indexes.json`: a new query may need an index. Deployed indexes take minutes to
  build, and the query fails until then.
- `functions/` (a separate Node project): `joinGroup`, `deleteAccount`, bundled push
  (`notifyOnItemChange`, `sendBatchedNotification`) and the cleanup after deletes. See
  [notifications.md](notifications.md) for how push works.

**Regions.** Cloud Functions isn't offered in `europe-north2`, so the functions run in
`europe-north1` (Finland) while the Firestore trigger stays with the database. Cloud Tasks isn't
offered in either Nordic region, so the push queue runs in `europe-west1`. If you change the
functions' region, change `FUNCTIONS_REGION` in `constants/firebase.ts` too (a test checks it).

**First functions deploy.** It turns on several Google Cloud services and their service accounts.
Expect "failed to modify the IAM policy" or Eventarc permission errors on the first try or two:
wait 5 to 15 minutes and deploy again. The first deploy also turns on the Cloud Tasks API; if the
item trigger then fails with a permission error, see the end of [notifications.md](notifications.md).

## 4. Emulators and tests

```bash
firebase emulators:start   # Auth 9099, Firestore 8080, Functions 5001 (firebase.json)
```

Set `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` in `.env.local` (`localhost` for web, `10.0.2.2` for the
Android emulator) and restart Expo to use them; release builds always use the real project. The
ports are also in `constants/firebase.ts`, and a test checks the two match.

The rules and functions tests start the Firestore emulator themselves and need Java 21 or later:

```bash
npm test                # app: helpers, components, screens, hooks
npm run test:rules      # firestore.rules
npm run test:functions  # functions/
```

If port 8080 is taken on your machine, run them with a copy of `firebase.json` that sets another
Firestore port: `firebase emulators:exec --config <copy> --only firestore ...`.

## 5. Phones (EAS)

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android   # an installable APK
```

- Add the `EXPO_PUBLIC_FIREBASE_*` values as EAS environment variables for the preview and
  production environments (plain text is fine; they're public).
- **Push on Android** goes through FCM in the same Firebase project: `google-services.json` is in
  the repo (`android.googleServicesFile` in `app.json`), and the FCM V1 service account key is
  uploaded with `eas credentials` › Android › Google Service Account. That key is a real secret:
  it belongs in EAS only, never in the repo or the app.
- Push doesn't work in Expo Go; use a development or preview build. Web and Expo Go show the same
  notifications in-app while the app is open.
- JavaScript-only changes can reach installed apps with `eas update`; a new build is needed only for
  native changes or `app.json`.

## 6. Web (GitHub Pages)

Every push to `main` builds the web app and publishes it (`.github/workflows/deploy-web.yml`).
The Firebase values come from the repository's **Settings › Secrets and variables › Actions ›
Variables** (`EXPO_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_APP_ID`, and
optionally `_APPCHECK_SITE_KEY`). Pages must be set to "GitHub Actions" in the repository's
settings, and the Pages domain (`<owner>.github.io`) added under Authorized domains in Firebase
Authentication. The site lives under `/<repository name>`, which the workflow passes to the export
as `EXPO_BASE_URL`; `app.config.ts` sets the base path only then, so local development runs at `/`.

**CI.** `.github/workflows/ci.yml` runs on every pull request and push to `main`: typecheck, lint
and `npm test` (including a check that every locale has the same keys and placeholders as
`en.json`), lint and build of `functions/`, the emulator tests, a web and Android export, and
`expo-doctor` (advisory).

**App Check** runs on web when `EXPO_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` is set. Don't enforce it
yet: phones have no App Check provider (`api/appCheck.ts`), so enforcing would lock them out.

**API key.** The key in `google-services.json` and the web config is public by design. Make sure
it is restricted in Google Cloud Console › APIs & Services › Credentials: the Android key to the
app's package name and SHA-1, and both keys to the APIs the app uses.
