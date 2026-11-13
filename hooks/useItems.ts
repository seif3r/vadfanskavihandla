import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "@/api/ApiError";
import { addItem, getItems, removeDone, setAllDone, toggleItem } from "@/api/items";
import { useAuth } from "@/context/AuthContext";
import { NewItem } from "@/types/api";
import { itemKey } from "@/helpers/list";
import { Item, KnownItem } from "@/types/models";

// Items for one list. No refetch after changes: useLiveUpdates writes every change
// (ours, the moment it is made, and everyone else's) into the cache.
export function useItems(listId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["items", listId];
  // The latest change that failed, with the list it was made on. Cleared when the next change
  // starts rather than when it succeeds, since offline a write may not be confirmed for a long time.
  const [failed, setFailed] = useState<{ listId: string | undefined; error: ApiError } | null>(null);
  const onMutate = () => setFailed(null);
  const onError = (error: ApiError) => setFailed({ listId, error });

  const itemsQuery = useQuery({
    queryKey,
    queryFn: () => getItems(listId!),
    enabled: !!listId,
  });

  // Every function in api/ throws ApiError, hence the error type.
  const addMutation = useMutation<Item, ApiError, NewItem>({
    mutationFn: (newItem) => addItem({ ...newItem, listId: listId! }, user!.id),
    onMutate,
    onError,
    // Remember the category locally too, so the next add of the same name suggests it.
    onSuccess: ({ name, category }) => {
      if (!category) return;
      queryClient.setQueryData<KnownItem[]>(["knownItems", listId], (old = []) => [
        ...old.filter((known) => itemKey(known.name) !== itemKey(name)),
        { name, category },
      ]);
    },
  });

  // Optimistic: flips the checkbox on screen right away instead of waiting for the server,
  // and puts it back if the request fails.
  const toggleMutation = useMutation<Item, ApiError, string, { previous: Item[] | undefined }>({
    mutationFn: (itemId) => toggleItem(itemId, user!.id),
    onMutate: async (itemId) => {
      onMutate();
      // Stop in-flight refetches so they don't overwrite the optimistic change.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Item[]>(queryKey);
      queryClient.setQueryData<Item[]>(queryKey, (old) =>
        old?.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
      );
      return { previous };
    },
    onError: (error, _itemId, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      onError(error);
    },
  });

  const setAllDoneMutation = useMutation<Item[], ApiError, boolean>({
    mutationFn: (done) => setAllDone(listId!, done, user!.id),
    onMutate,
    onError,
  });

  const removeDoneMutation = useMutation<void, ApiError>({
    mutationFn: () => removeDone(listId!),
    onMutate,
    onError,
  });

  return {
    items: itemsQuery.data ?? [],
    isLoading: itemsQuery.isLoading,
    // onError lets the screen put back what was typed, so a failed add doesn't lose it.
    addItem: (newItem: NewItem, onFailed?: () => void) => addMutation.mutate(newItem, { onError: onFailed }),
    isAdding: addMutation.isPending,
    toggleItem: toggleMutation.mutate,
    checkAll: () => setAllDoneMutation.mutate(true),
    uncheckAll: () => setAllDoneMutation.mutate(false),
    removeChecked: () => removeDoneMutation.mutate(),
    // Only for the list it happened on, so switching lists doesn't carry it over.
    error: failed?.listId === listId ? failed?.error ?? null : null,
  };
}
