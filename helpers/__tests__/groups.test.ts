import { describe, expect, it } from "@jest/globals";
import { findInviteCode, groupName, memberKey, personalFirst, personalGroupId } from "@/helpers/groups";
import { Group } from "@/types/models";

const group = (memberIds: string[]): Group => ({
  id: "g", name: "Home", isPersonal: false, ownerId: memberIds[0], memberIds, removedMemberIds: [],
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

describe("personal groups", () => {
  const mine: Group = { ...group(["anna"]), id: "personal_anna", name: "", isPersonal: true };
  const t = () => "My lists";

  it("have an id made from the user's", () => {
    expect(personalGroupId("anna")).toBe("personal_anna");
  });
  it("are called by the translated name, other groups by their own", () => {
    expect(groupName(mine, t)).toBe("My lists");
    expect(groupName(group(["anna"]), t)).toBe("Home");
  });
  it("come first, the rest in the order they came", () => {
    const a = { ...group(["anna"]), id: "a" };
    const b = { ...group(["anna"]), id: "b" };
    expect(personalFirst([a, mine, b]).map((g) => g.id)).toEqual(["personal_anna", "a", "b"]);
  });
});
