import { ReactNode } from "react";

import { ApiError } from "@/api/ApiError";
import { User, UserSettings } from "@/types/models";

export interface ProviderProps {
  children: ReactNode;
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  // Set when there is a session but the user couldn't be loaded (offline); reload tries again.
  loadError: ApiError | null;
  reload: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

// Which list is open. The lists themselves are server data and come from hooks/useLists.ts.
export interface ActiveListContextValue {
  activeListId: string | null;
  setActiveListId: (id: string) => void;
}
