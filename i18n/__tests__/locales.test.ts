// CLAUDE.md: every locale has the same keys as en.json, the reference. A key missing in one
// language shows the raw key in the UI, and a missing {{placeholder}} drops a name or a count.
import { describe, expect, it } from "@jest/globals";

import en from "@/i18n/locales/en.json";
import sv from "@/i18n/locales/sv.json";

type Messages = { [key: string]: string | Messages };

const locales: Record<string, Messages> = { sv };

// { a: { b: "x" } } becomes { "a.b": "x" }.
function flatten(messages: Messages, prefix = ""): Record<string, string> {
  return Object.entries(messages).reduce<Record<string, string>>((flat, [key, value]) => {
    const path = prefix + key;
    return typeof value === "string"
      ? { ...flat, [path]: value }
      : { ...flat, ...flatten(value, `${path}.`) };
  }, {});
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)/g)].map((match) => match[1]).sort();
}

const reference = flatten(en);

describe.each(Object.entries(locales))("locale %s", (_name, messages) => {
  const flat = flatten(messages);

  it("has every key in en.json", () => {
    expect(Object.keys(reference).filter((key) => !(key in flat))).toEqual([]);
  });

  it("has no keys that en.json lacks", () => {
    expect(Object.keys(flat).filter((key) => !(key in reference))).toEqual([]);
  });

  it("uses the same {{placeholders}} as en.json", () => {
    const mismatched = Object.keys(reference).filter(
      (key) => key in flat && placeholders(reference[key]).join() !== placeholders(flat[key]).join(),
    );
    expect(mismatched).toEqual([]);
  });
});
