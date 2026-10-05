// Sets up translations. Import once, at the app root, before any screen renders.
// To add a language: create locales/<code>.json, add the code to Language in types/i18n.ts,
// and add it to `resources` and `languages` below.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/locales/en.json";
import sv from "@/i18n/locales/sv.json";
import { Language, LanguageOption } from "@/types/i18n";

// `satisfies` makes every language file a type error if it's missing a key from English.
export const resources = {
  en: { translation: en },
  sv: { translation: sv },
} as const satisfies Record<Language, { translation: typeof en }>;

export const languages: LanguageOption[] = [
  { code: "en", name: "English" },
  { code: "sv", name: "Svenska" },
];

// The standalone `use` export that lint suggests isn't bound to the instance, so it would break.
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  // Used until a user logs in; after that, the user's own setting applies.
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    // React already escapes output.
    escapeValue: false,
  },
});

export default i18n;
