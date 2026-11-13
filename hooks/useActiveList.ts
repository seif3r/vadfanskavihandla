import { useActiveListId } from "@/context/ActiveListContext";
import { useLists } from "@/hooks/useLists";

// The list that is open: the one the user picked, or the first until they pick one.
export function useActiveList() {
  const { activeListId, setActiveListId } = useActiveListId();
  const { lists, isLoading, loadError, reload } = useLists();
  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null;
  return { activeList, setActiveListId, isLoading, loadError, reload };
}
