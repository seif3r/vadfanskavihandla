import { createContext, useContext } from "react";

import { ApiError } from "@/api/ApiError";

// Why the data isn't live right now (a listener failed and is waiting to be restarted), or null.
// Provided by the root layout from useLiveUpdates, which is mounted once there.
const LiveStatusContext = createContext<ApiError | null>(null);

export const LiveStatusProvider = LiveStatusContext.Provider;

export function useLiveStatus(): ApiError | null {
  return useContext(LiveStatusContext);
}
