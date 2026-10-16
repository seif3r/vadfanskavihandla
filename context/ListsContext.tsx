import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useContext, useState } from "react";

import { acceptInvite, createInvite, createList, deleteList, getLists } from "@/api/lists";
import { useAuth } from "@/context/AuthContext";
import { ListsContextValue } from "@/types/context";

const ListsContext = createContext<ListsContextValue | null>(null);
const listsKey = ["lists"];

// The shopping lists, which one is selected, and adding/removing lists.
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
    mutationFn: createList,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: (_result, listId) => {
      queryClient.removeQueries({ queryKey: ["items", listId] });
    },
  });

  const joinMutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: (list) => setActiveListId(list.id),
  });

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
        createList: createMutation.mutate,
        isCreatingList: createMutation.isPending,
        deleteList: deleteMutation.mutate,
        createInvite: (list) => createInvite(list.id, list.name),
        joinList: async (code) => {
          await joinMutation.mutateAsync(code);
        },
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
