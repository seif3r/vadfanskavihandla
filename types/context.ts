import { ShoppingList, User, UserSettings } from "@/types/models";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

export interface ListsContextValue {
  lists: ShoppingList[];
  activeList: ShoppingList | null;
  setActiveListId: (id: string) => void;
  isLoading: boolean;
  createList: (name: string) => void;
  isCreatingList: boolean;
  deleteList: (listId: string) => void;
}
