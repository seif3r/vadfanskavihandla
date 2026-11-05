// App Check on web: proves to Firebase that requests come from this site.
import { FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

export function startAppCheck(app: FirebaseApp): void {
  const siteKey = process.env.EXPO_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  // No window: the static export renders this file on the server too. In development,
  // localhost isn't a domain the key is registered for.
  if (!siteKey || __DEV__ || typeof window === "undefined") return;
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
