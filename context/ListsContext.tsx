import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useContext, useState } from "react";

import { toApiError } from "@/api/firebase";
import { createList, deleteList, getLists } from "@/api/lists";
import { useAuth } from "@/context/AuthContext";
import { ListsContextValue } from "@/types/context";

const ListsContext = createContext<ListsContextValue | null>(null);
const listsKey = ["lists"];

// The shopping lists of all the user's groups, which one is selected, and adding/removing lists.
export function ListsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const listsQuery = useQuery({
    queryKey: listsKey,
    queryFn: getLists,
    enabled: !!user,
  });

  // No refetch after changes: useLiveUpdates writes every change to the lists into the cache.
  const createMutation = useMutation({
    mutationFn: ({ groupId, name }: { groupId: string; name: string }) => createList(groupId, name),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: (_result, listId) => {
      queryClient.removeQueries({ queryKey: ["items", listId] });
    },
  });

  const listError = createMutation.error ?? deleteMutation.error;
  const lists = listsQuery.data ?? [];
  // Falls back to the first list until the user picks one.
  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null;

  return (
    <ListsContext.Provider
      value={{
        lists,
        activeList,
        setActiveListId,
        isLoading: listsQuery.isLoading,
        createList: (groupId, name) => createMutation.mutate({ groupId, name }),
        isCreatingList: createMutation.isPending,
        deleteList: deleteMutation.mutate,
        error: listError && toApiError(listError),
      }}
    >
      {children}
    </ListsContext.Provider>
  );
}

export function useLists(): ListsContextValue {
  const context = useContext(ListsContext);
  if (!context) throw new Error("useLists must be used inside ListsProvider");
  return context;
}
