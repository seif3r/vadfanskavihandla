import { useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import * as authApi from "@/api/auth";
import * as settingsApi from "@/api/settings";
import { clearToken, getToken, setToken } from "@/helpers/storage";
import i18n from "@/i18n";
import { AuthContextValue } from "@/types/context";
import { User, UserSettings } from "@/types/models";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // On startup, restore the session from a saved token.
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) setUser(await authApi.getCurrentUser(token));
      } catch {
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Shows the app in the logged-in user's language, and follows changes to it.
  const language = user?.settings.language;
  useEffect(() => {
    if (language) i18n.changeLanguage(language);
  }, [language]);

  const login = async (email: string, password: string) => {
    const { token, user } = await authApi.login(email, password);
    await setToken(token);
    setUser(user);
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
    // Drop cached data so the next user doesn't see it.
    queryClient.clear();
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    if (!user) return;
    setUser(await settingsApi.updateSettings(user.id, settings));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
