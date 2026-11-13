import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import * as authApi from "@/api/auth";
import { removePushToken } from "@/api/push";
import { userKey, useCurrentUser } from "@/hooks/useCurrentUser";
import { ApiError } from "@/api/ApiError";
import { getPushToken } from "@/helpers/notifications";
import { deviceLanguage } from "@/helpers/language";
import i18n from "@/i18n";
import { AuthContextValue, ProviderProps } from "@/types/context";
import { ErrorKey } from "@/types/errors";
import { User } from "@/types/models";

const AuthContext = createContext<AuthContextValue | null>(null);

// Errors loading the user that don't mean the session is bad.
const RETRYABLE_ERRORS: ErrorKey[] = ["errors.offline", "errors.unknown"];

// Whether someone is logged in. The user's profile and settings are server data, so they live
// in the query cache (hooks/useCurrentUser.ts); this only keeps track of the session.
export function AuthProvider({ children }: ProviderProps) {
  // null until Firebase has restored (or not) the session it keeps on the device.
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const queryClient = useQueryClient();
  const current = useCurrentUser(hasSession === true);

  useEffect(() => {
    authApi.hasSession()
      .then(setHasSession)
      .catch(() => setHasSession(false));
  }, []);

  // Firebase can end the session by itself (password changed on another device, account disabled
  // or deleted). Show the login screen then, instead of an app whose every call is denied. Starting
  // a session is left to login, register and hasSession, which also load the user.
  useEffect(() => authApi.subscribeToSession((isSignedIn) => {
    if (isSignedIn) return;
    setHasSession((current) => (current === null ? current : false));
    queryClient.clear();
  }), [queryClient]);

  // The user couldn't be loaded. Offline (common in a store) or for an unknown reason, the session
  // is still good: keep it and let the app offer a retry instead of the login screen. Otherwise
  // (no user document, session expired, account disabled) end it and show the login screen.
  const { error } = current;
  const canRetry = error instanceof ApiError && RETRYABLE_ERRORS.includes(error.key);
  useEffect(() => {
    if (!error || canRetry) return;
    setHasSession(false);
    authApi.logout().catch(() => {});
  }, [error, canRetry]);

  const user = hasSession ? current.user : null;
  const isLoading = hasSession === null || current.isLoading;
  const loadError = hasSession && canRetry ? error : null;

  // Shows the app in the logged-in user's language, and follows changes to it. Logged out, the
  // device's. Set after the first render (i18n starts in English), so the web page's static HTML,
  // rendered without a browser, matches the browser's first render.
  const language = user?.settings.language;
  useEffect(() => {
    i18n.changeLanguage(language ?? deviceLanguage());
  }, [language]);

  // Puts the user in the cache before marking the session, so the screens never see a
  // logged-in app without a user.
  const startSession = (loggedIn: User) => {
    queryClient.setQueryData(userKey, loggedIn);
    setHasSession(true);
  };

  const login = async (email: string, password: string) => {
    startSession(await authApi.login(email, password));
  };

  const register = async (name: string, email: string, password: string) => {
    startSession(await authApi.register(name, email, password));
  };

  const logout = async () => {
    try {
      // Stop push to this device. Before signing out, while the rules still know who we are.
      const pushToken = await getPushToken().catch(() => null);
      if (user && pushToken) await removePushToken(user.id, pushToken).catch(() => {});
      // Never throws: callers (the user menu) don't wait for it, and logging out locally is what matters.
      await authApi.logout().catch(() => {});
    } finally {
      // Log out locally even if Firebase can't be reached.
      setHasSession(false);
      // Drop cached data (the user included) so the next user doesn't see it.
      queryClient.clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user, isLoading, loadError, reload: current.reload, login, register, logout,
        updateSettings: current.updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
