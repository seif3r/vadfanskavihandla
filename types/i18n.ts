// Languages the app is translated into. Add a code here together with its locales/<code>.json.
export type Language = "en" | "sv";

export interface LanguageOption {
  code: Language;
  // The language's name in that language itself, e.g. "Svenska", so people can find their own.
  name: string;
}
