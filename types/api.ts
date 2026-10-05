import { Category, User } from "@/types/models";

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AddItemRequest {
  listId: string;
  name: string;
  amount?: string;
  category?: Category;
}

// What the add form sends; the list id is filled in by useItems.
export type NewItem = Omit<AddItemRequest, "listId">;
