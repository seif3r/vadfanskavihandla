/// <reference types="node" />
// The same limits are written down in three places: constants/limits.ts (the inputs),
// firestore.rules and functions/. These tests fail when one is changed without the others.
import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";

import { EMULATOR_PORTS, FUNCTIONS_REGION } from "@/constants/firebase";
import {
  INVITE_LIFETIME_DAYS, NOTIFICATION_DELAY_SECONDS, MAX_AMOUNT_LENGTH, MAX_EMAIL_LENGTH, MAX_GROUP_NAME_LENGTH, MAX_LIST_NAME_LENGTH,
  MAX_NAME_LENGTH, MAX_PERSON_NAME_LENGTH,
} from "@/constants/limits";
import { categories } from "@/helpers/categories";

const root = join(__dirname, "..", "..");
const rules = readFileSync(join(root, "firestore.rules"), "utf8");
const functionsSource = readFileSync(join(root, "functions", "src", "index.ts"), "utf8");

// The number in e.g. "function validName(name) { return validText(name, 100); }".
function ruleLimit(fn: string): number {
  const match = rules.match(new RegExp(`function ${fn}\\(\\w+\\)\\s*\\{\\s*return validText\\(\\w+, (\\d+)\\)`));
  if (!match) throw new Error(`${fn} not found in firestore.rules`);
  return Number(match[1]);
}

describe("firestore.rules matches constants/limits.ts", () => {
  it.each([
    ["validName", MAX_NAME_LENGTH],
    ["validListName", MAX_LIST_NAME_LENGTH],
    ["validPersonName", MAX_PERSON_NAME_LENGTH],
    ["validGroupName", MAX_GROUP_NAME_LENGTH],
    ["validEmail", MAX_EMAIL_LENGTH],
  ])("%s allows %i characters", (fn, limit) => {
    expect(ruleLimit(fn)).toBe(limit);
  });

  it("validAmount allows the same length", () => {
    expect(rules).toMatch(new RegExp(`amount\\.size\\(\\) <= ${MAX_AMOUNT_LENGTH}\\b`));
  });

  it("validCategory allows exactly the app's categories", () => {
    const list = rules.match(/category in \[([^\]]*)\]/)?.[1] ?? "";
    const ruleCategories = [...list.matchAll(/'(\w+)'/g)].map((m) => m[1]);
    expect(ruleCategories.sort()).toEqual([...categories].sort());
  });
});

describe("functions/ matches constants/limits.ts", () => {
  it("uses the same invite lifetime", () => {
    const days = functionsSource.match(/INVITE_LIFETIME_MS = (\d+) \* 24 \* 60 \* 60 \* 1000/)?.[1];
    expect(Number(days)).toBe(INVITE_LIFETIME_DAYS);
  });

  it("waits as long as the app before notifying", () => {
    const seconds = functionsSource.match(/const DELAY_SECONDS = (\d+);/)?.[1];
    expect(Number(seconds)).toBe(NOTIFICATION_DELAY_SECONDS);
  });

  it("runs in the region the app calls", () => {
    expect(functionsSource.match(/const region = "([\w-]+)";/)?.[1]).toBe(FUNCTIONS_REGION);
  });
});

describe("firebase.json matches constants/firebase.ts", () => {
  const config = JSON.parse(readFileSync(join(root, "firebase.json"), "utf8"));

  it.each(Object.entries(EMULATOR_PORTS))("runs the %s emulator on port %i", (name, port) => {
    expect(config.emulators[name]?.port).toBe(port);
  });
});
