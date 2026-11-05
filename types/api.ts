import { Category, UserSettings } from "@/types/models";

export interface AddItemRequest {
  listId: string;
  name: string;
  amount?: string;
  category?: Category;
}

// What the add form sends; the list id is filled in by useItems.
export type NewItem = Omit<AddItemRequest, "listId">;

// Arguments of the mutations in hooks/, which take a single object.
export interface CreateListRequest {
  groupId: string;
  name: string;
}

export interface RenameGroupRequest {
  groupId: string;
  name: string;
}

export interface RemoveMemberRequest {
  groupId: string;
  userId: string;
}

// What the joinGroup Cloud Function takes.
export interface JoinGroupRequest {
  code: string;
}

export interface UpdateSettingsRequest {
  userId: string;
  settings: Partial<UserSettings>;
}
