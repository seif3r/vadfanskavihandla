// Opens the system share sheet. Returns false where there is none (most desktop browsers),
// so the caller can show the text on screen instead.
import { Share } from "react-native";

export async function shareText(message: string): Promise<boolean> {
  try {
    await Share.share({ message });
    return true;
  } catch {
    return false;
  }
}
