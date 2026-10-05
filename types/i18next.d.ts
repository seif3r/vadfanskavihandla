// Makes t("...") keys type-checked against the English file:
// a misspelled or missing key is a TypeScript error, and the editor autocompletes keys.
import "i18next";

import { resources } from "@/i18n";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: (typeof resources)["en"];
  }
}
