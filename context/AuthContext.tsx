import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import * as authApi from "@/api/auth";
import { removePushToken } from "@/api/push";
import { userKey, useCurrentUser } from "@/hooks/useCurrentUser";
import { ApiError } from "@/api/ApiError";
import { getPushToken } from "@/helpers/notifications";
import i18n from "@/i18n";
import { AuthContextValue, ProviderProps } from "@/types/context";
import { User } from "@/types/models";

const AuthContext = createContext<AuthContextValue | null>(null);

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

  // The user couldn't be loaded: show the login screen. If the account has no user document,
  // also end the Firebase session, or the next start would hit the same wall. Other errors
  // (offline) keep it, so the next start can try again.
  const { error } = current;
  useEffect(() => {
    if (!error) return;
    setHasSession(false);
    if (error instanceof ApiError && error.key === "errors.invalidSession") authApi.logout().catch(() => {});
  }, [error]);

  const user = hasSession ? current.user : null;
  const isLoading = hasSession === null || current.isLoading;

  // Shows the app in the logged-in user's language, and follows changes to it.
  const language = user?.settings.language;
  useEffect(() => {
    if (language) i18n.changeLanguage(language);
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
      await authApi.logout();
    } finally {
      // Log out locally even if Firebase can't be reached.
      setHasSession(false);
      // Drop cached data (the user included) so the next user doesn't see it.
      queryClient.clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, updateSettings: current.updateSettings }}
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
