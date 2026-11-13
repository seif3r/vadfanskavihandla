import { languages } from "@/i18n";
import { Language } from "@/types/i18n";

// The app language closest to the device's (or browser's) own: "sv-SE" gives "sv". English when
// the device's language isn't one the app has, like i18n's fallbackLng.
export function deviceLanguage(locale: string = currentLocale()): Language {
  const code = locale.toLowerCase().split(/[-_]/)[0];
  return languages.find((language) => language.code === code)?.code ?? "en";
}

function currentLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    // Some engines lack Intl.
    return "en";
  }
}
