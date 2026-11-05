import { createContext, useContext, useState } from "react";

import { ActiveListContextValue, ProviderProps } from "@/types/context";

const ActiveListContext = createContext<ActiveListContextValue | null>(null);

// Which list is open on the home screen. Only the choice lives here; the lists themselves
// are server data (hooks/useLists.ts) and hooks/useActiveList.ts combines the two.
export function ActiveListProvider({ children }: ProviderProps) {
  const [activeListId, setActiveListId] = useState<string | null>(null);
  return (
    <ActiveListContext.Provider value={{ activeListId, setActiveListId }}>
      {children}
    </ActiveListContext.Provider>
  );
}

export function useActiveListId(): ActiveListContextValue {
  const context = useContext(ActiveListContext);
  if (!context) throw new Error("useActiveListId must be used inside ActiveListProvider");
  return context;
}
