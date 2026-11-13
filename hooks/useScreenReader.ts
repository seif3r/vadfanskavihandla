import { useEffect, useState } from "react";

import { subscribeToScreenReader } from "@/helpers/accessibility";

// Whether a screen reader is on, kept up to date.
export function useScreenReader(): boolean {
  const [isOn, setIsOn] = useState(false);
  useEffect(() => subscribeToScreenReader(setIsOn), []);
  return isOn;
}
