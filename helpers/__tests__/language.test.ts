import { describe, expect, it } from "@jest/globals";

import { deviceLanguage } from "@/helpers/language";

describe("deviceLanguage", () => {
  it.each([
    ["sv-SE", "sv"],
    ["sv", "sv"],
    ["SV_FI", "sv"],
    ["en-GB", "en"],
    ["de-DE", "en"],
    ["", "en"],
  ])("gives %s as %s", (locale, language) => {
    expect(deviceLanguage(locale)).toBe(language);
  });
});
