import en from "@/i18n/locales/en.json";

// Translation keys for API errors, e.g. "errors.unknownEmail".
export type ErrorKey = `errors.${keyof typeof en.errors}`;
