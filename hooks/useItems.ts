import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "@/api/ApiError";
import { addItem, getItems, removeDone, setAllDone, toggleItem, updateItem } from "@/api/items";
import { useAuth } from "@/context/AuthContext";
import { EditItemRequest, NewItem } from "@/types/api";
import { rememberCategory } from "@/helpers/list";
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

  // Remember a category locally too, so the next add of the same name suggests it.
  const remember = (name: string, category: Item["category"]) => {
    if (!category) return;
    queryClient.setQueryData<KnownItem[]>(["knownItems", listId], (old = []) => rememberCategory(old, name, category));
  };

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
    onSuccess: ({ name, category }) => remember(name, category),
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

  // Optimistic like toggling: the edit shows right away and is undone if the save fails.
  const editMutation = useMutation<void, ApiError, Omit<EditItemRequest, "listId">, { previous: Item[] | undefined }>({
    mutationFn: (edit) => updateItem({ ...edit, listId: listId! }, user!.id),
    onMutate: async ({ itemId, name, amount, category }) => {
      onMutate();
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Item[]>(queryKey);
      queryClient.setQueryData<Item[]>(queryKey, (old) =>
        old?.map((item) => (item.id === itemId ? { ...item, name, amount, category } : item)),
      );
      return { previous };
    },
    onError: (error, _edit, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      onError(error);
    },
    onSuccess: (_result, { name, category }) => remember(name, category),
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
    editItem: editMutation.mutate,
    checkAll: () => setAllDoneMutation.mutate(true),
    uncheckAll: () => setAllDoneMutation.mutate(false),
    removeChecked: () => removeDoneMutation.mutate(),
    // Only for the list it happened on, so switching lists doesn't carry it over.
    error: failed?.listId === listId ? failed?.error ?? null : null,
  };
}
