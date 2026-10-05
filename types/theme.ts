// Named colours. Each palette in constants/theme.ts (light, dark) provides all of them.
export interface ThemeColors {
  // The one accent colour: main buttons, active tab, checkboxes, switches.
  primary: string;
  // Primary buttons while pressed.
  primaryPressed: string;
  // Green text, readable on surface and primarySoft.
  primaryText: string;
  // Subtle green tint behind selected/active elements.
  primarySoft: string;

  // Screen background.
  background: string;
  // Cards, rows, menus, inputs and bars on top of the background.
  surface: string;

  text: string;
  // Secondary text: labels, hints, amounts.
  textMuted: string;
  // Text on primary backgrounds.
  textOnColor: string;

  // Outlines of inputs and cards.
  border: string;
  // Thin lines between rows.
  divider: string;

  // Checked-off items.
  doneBackground: string;
  doneText: string;

  // Only for destructive actions: delete, log out, errors.
  danger: string;
  // Text on danger backgrounds.
  textOnDanger: string;

  // Dims the screen behind menus.
  backdrop: string;
  shadow: string;
}

export type ColorScheme = "light" | "dark";

// The user's choice in Settings. "system" follows the phone's or browser's setting.
export type ThemePreference = "system" | ColorScheme;
