import { describe, expect, it } from "@jest/globals";
import { findInviteCode, memberKey } from "@/helpers/groups";
import { Group } from "@/types/models";

const group = (memberIds: string[]): Group => ({
  id: "g", name: "Home", ownerId: memberIds[0], memberIds, removedMemberIds: [],
});

describe("memberKey", () => {
  it("is empty without groups", () => {
    expect(memberKey()).toBe("");
  });
  it("lists everyone once, in a stable order", () => {
    expect(memberKey([group(["b", "a"]), group(["c", "a"])])).toBe("a,b,c");
  });
  it("doesn't depend on the order of the groups", () => {
    expect(memberKey([group(["x"]), group(["y"])])).toBe(memberKey([group(["y"]), group(["x"])]));
  });
});

describe("findInviteCode", () => {
  const code = "AbCdEfGhIj0123456789";

  it("takes a code on its own, trimmed", () => {
    expect(findInviteCode(` ${code} `)).toBe(code);
  });

  it("finds the code in the whole shared message", () => {
    expect(findInviteCode(`Gå med i min grupp "Hemma" i Vad fan ska vi handla. Inbjudningskod: ${code} (gäller i 7 dagar)`))
      .toBe(code);
  });

  it("finds nothing that isn't exactly 20 letters and digits", () => {
    expect(findInviteCode("abc123")).toBeNull();
    expect(findInviteCode(`${code}X`)).toBeNull();
    expect(findInviteCode("")).toBeNull();
  });
});
