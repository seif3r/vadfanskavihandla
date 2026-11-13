import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/ApiError";
import { createList, deleteList, getLists } from "@/api/lists";
import { useAuth } from "@/context/AuthContext";
import { CreateListRequest } from "@/types/api";
import { ShoppingList } from "@/types/models";

// The shopping lists of all the user's groups, and adding/removing lists. No refetch after
// changes: useLiveUpdates writes every change to the lists into the cache.
export function useLists() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const listsQuery = useQuery<ShoppingList[], ApiError>({ queryKey: ["lists"], queryFn: getLists, enabled: !!user });

  // createList and deleteList turn every failure into an ApiError, hence the error type.
  const createMutation = useMutation<ShoppingList, ApiError, CreateListRequest>({
    mutationFn: ({ groupId, name }) => createList(groupId, name),
  });

  const deleteMutation = useMutation<void, ApiError, string>({
    mutationFn: deleteList,
    onSuccess: (_result, listId) => {
      queryClient.removeQueries({ queryKey: ["items", listId] });
    },
  });

  return {
    lists: listsQuery.data ?? [],
    isLoading: listsQuery.isLoading,
    // Only while there's nothing to show; once the live listener has delivered lists, they're shown.
    loadError: listsQuery.data ? null : listsQuery.error,
    reload: () => listsQuery.refetch(),
    createList: (groupId: string, name: string) => createMutation.mutate({ groupId, name }),
    isCreatingList: createMutation.isPending,
    deleteList: deleteMutation.mutate,
    // From the latest failed create or delete, until the next one succeeds.
    error: createMutation.error ?? deleteMutation.error,
  };
}
