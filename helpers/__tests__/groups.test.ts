import { describe, expect, it } from "@jest/globals";
import { memberKey } from "@/helpers/groups";
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
