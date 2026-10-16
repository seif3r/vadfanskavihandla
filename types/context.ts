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
  createList: (name: string) => void;
  isCreatingList: boolean;
  deleteList: (listId: string) => void;
  // Returns an invite code others can use to join the list.
  createInvite: (list: ShoppingList) => Promise<string>;
  // Joins the list the code points to and makes it the active list.
  joinList: (code: string) => Promise<void>;
}
