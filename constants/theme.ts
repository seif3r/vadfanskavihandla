// The app's colours, in one place. Components get the active palette through
// useColors()/useThemedStyles() in hooks/useTheme.ts, never by writing hex codes.
// Every text/background pair has been checked to reach at least 4.5:1 contrast (WCAG AA),
// and UI elements like checkboxes at least 3:1.
import { ColorScheme, ThemeColors } from "@/types/theme";

const light: ThemeColors = {
  primary: "#2E7D52",
  primaryPressed: "#24633F",
  primaryText: "#24633F",
  primarySoft: "#E4F2E9",
  background: "#F5F7F4",
  surface: "#FFFFFF",
  text: "#1D2420",
  textMuted: "#5B6660",
  textOnColor: "#FFFFFF",
  border: "#DCE2DD",
  divider: "#EDF0EE",
  doneBackground: "#ECEFEC",
  doneText: "#5A665F",
  danger: "#C0392B",
  textOnDanger: "#FFFFFF",
  backdrop: "rgba(29, 36, 32, 0.25)",
  shadow: "#000000",
};

const dark: ThemeColors = {
  primary: "#2E7D52",
  primaryPressed: "#276B46",
  // Lighter green: dark green text would disappear on dark backgrounds.
  primaryText: "#7FD1A0",
  primarySoft: "#1E3328",
  background: "#111513",
  surface: "#1B201D",
  text: "#E6EBE7",
  textMuted: "#9AA59E",
  textOnColor: "#FFFFFF",
  border: "#323B35",
  divider: "#262C28",
  // Checked rows sink back into the background instead of standing out.
  doneBackground: "#151917",
  doneText: "#8E9992",
  danger: "#E06A5E",
  // Dark text: white isn't readable enough on the lighter dark-mode red.
  textOnDanger: "#111513",
  backdrop: "rgba(0, 0, 0, 0.55)",
  shadow: "#000000",
};

export const palettes: Record<ColorScheme, ThemeColors> = { light, dark };

export const radius = {
  small: 6,
  medium: 10,
  large: 14,
  round: 999,
};
