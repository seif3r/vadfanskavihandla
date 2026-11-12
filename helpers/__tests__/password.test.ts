import { describe, expect, it } from "@jest/globals";

import { MIN_PASSWORD_LENGTH } from "@/constants/limits";
import { checkNewPassword } from "@/helpers/password";

describe("checkNewPassword", () => {
  it("accepts a new password that is long enough, repeated and different", () => {
    expect(checkNewPassword("gammalt1", "nyttlösen", "nyttlösen")).toBeNull();
  });
  it("asks for every field", () => {
    expect(checkNewPassword("", "nyttlösen", "nyttlösen")).toBe("fillAll");
    expect(checkNewPassword("gammalt1", "", "nyttlösen")).toBe("fillAll");
    expect(checkNewPassword("gammalt1", "nyttlösen", "")).toBe("fillAll");
  });
  it("rejects passwords shorter than Firebase allows", () => {
    const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(checkNewPassword("gammalt1", short, short)).toBe("tooShort");
    const exact = "a".repeat(MIN_PASSWORD_LENGTH);
    expect(checkNewPassword("gammalt1", exact, exact)).toBeNull();
  });
  it("requires the repeated password to match", () => {
    expect(checkNewPassword("gammalt1", "nyttlösen", "nyttlösen2")).toBe("mismatch");
  });
  it("requires a password different from the current one", () => {
    expect(checkNewPassword("samma123", "samma123", "samma123")).toBe("sameAsCurrent");
  });
  it("doesn't trim spaces, which are part of the password", () => {
    expect(checkNewPassword("gammalt1", "nyttlösen ", "nyttlösen")).toBe("mismatch");
  });
});
