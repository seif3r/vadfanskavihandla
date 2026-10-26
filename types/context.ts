import { ApiError } from "@/api/ApiError";
import { ShoppingList, User, UserSettings } from "@/types/models";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

export interface ListsContextValue {
  lists: ShoppingList[];
  activeList: ShoppingList | null;
  setActiveListId: (id: string) => void;
  isLoading: boolean;
  createList: (groupId: string, name: string) => void;
  isCreatingList: boolean;
  deleteList: (listId: string) => void;
  // From the latest failed create or delete, until the next one succeeds.
  error: ApiError | null;
}
