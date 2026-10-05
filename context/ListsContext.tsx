import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useContext, useState } from "react";

import { createList, deleteList, getLists } from "@/api/lists";
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

  const refreshLists = () => queryClient.invalidateQueries({ queryKey: listsKey });

  const createMutation = useMutation({
    mutationFn: createList,
    onSuccess: refreshLists,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: (_result, listId) => {
      queryClient.removeQueries({ queryKey: ["items", listId] });
      return refreshLists();
    },
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
