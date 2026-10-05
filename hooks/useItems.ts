import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addItem, getItems, removeDone, setAllDone, toggleItem } from "@/api/items";
import { useAuth } from "@/context/AuthContext";
import { NewItem } from "@/types/api";
import { Item } from "@/types/models";

// Items for one list. Mutations refetch the list so everyone sees fresh data.
export function useItems(listId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["items", listId];

  const itemsQuery = useQuery({
    queryKey,
    queryFn: () => getItems(listId!),
    enabled: !!listId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationFn: (newItem: NewItem) => addItem({ ...newItem, listId: listId! }, user!.id),
    onSuccess: refresh,
  });

  // Optimistic: flips the checkbox on screen right away instead of waiting for the server,
  // and puts it back if the request fails.
  const toggleMutation = useMutation({
    mutationFn: (itemId: string) => toggleItem(itemId, user!.id),
    onMutate: async (itemId: string) => {
      // Stop in-flight refetches so they don't overwrite the optimistic change.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Item[]>(queryKey);
      queryClient.setQueryData<Item[]>(queryKey, (old) =>
        old?.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
      );
      return { previous };
    },
    onError: (_error, _itemId, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    // Sync with the server either way, in case someone else changed the list meanwhile.
    onSettled: refresh,
  });

  const setAllDoneMutation = useMutation({
    mutationFn: (done: boolean) => setAllDone(listId!, done, user!.id),
    onSuccess: refresh,
  });

  const removeDoneMutation = useMutation({
    mutationFn: () => removeDone(listId!),
    onSuccess: refresh,
  });

  return {
    items: itemsQuery.data ?? [],
    isLoading: itemsQuery.isLoading,
    addItem: addMutation.mutate,
    isAdding: addMutation.isPending,
    toggleItem: toggleMutation.mutate,
    checkAll: () => setAllDoneMutation.mutate(true),
    uncheckAll: () => setAllDoneMutation.mutate(false),
    removeChecked: () => removeDoneMutation.mutate(),
  };
}
