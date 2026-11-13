import { AccessibilityInfo } from "react-native";

// Calls onChange with whether a screen reader (TalkBack, VoiceOver) is on, now and whenever that
// changes. Returns a function that stops listening.
export function subscribeToScreenReader(onChange: (isOn: boolean) => void): () => void {
  let isActive = true;
  AccessibilityInfo.isScreenReaderEnabled()
    .then((isOn) => {
      if (isActive) onChange(isOn);
    })
    // Not supported everywhere (some browsers); then it's taken to be off.
    .catch(() => {});
  const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", onChange);
  return () => {
    isActive = false;
    subscription.remove();
  };
}
