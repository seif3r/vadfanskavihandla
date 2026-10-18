import { useQuery } from "@tanstack/react-query";

import { getKnownItems } from "@/api/items";
import { itemKey } from "@/helpers/list";
import { Category } from "@/types/models";

// The categories a list remembers per item name. Loaded once per list, so looking one up
// while typing is instant. useItems updates the cache when an item is added.
export function useKnownItems(listId: string | undefined) {
  const { data } = useQuery({
    queryKey: ["knownItems", listId],
    queryFn: () => getKnownItems(listId!),
    enabled: !!listId,
  });

  const categoryFor = (name: string): Category | undefined =>
    data?.find((known) => itemKey(known.name) === itemKey(name))?.category;

  return { categoryFor };
}
