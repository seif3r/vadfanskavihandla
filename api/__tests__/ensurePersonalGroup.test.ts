import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { ensurePersonalGroup } from "@/api/groups";

const mockSetDoc = jest.fn<(path: string, data: object) => Promise<void>>();
let mockExists = false;

jest.mock("@/api/firebase", () => ({
  ...jest.requireActual<typeof import("@/api/errors")>("@/api/errors"),
  db: {},
  functions: {},
  currentUid: () => "anna",
}));
jest.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  getDoc: () => Promise.resolve({ exists: () => mockExists }),
  setDoc: (path: string, data: object) => mockSetDoc(path, data),
  serverTimestamp: () => "<now>",
}));
jest.mock("firebase/functions", () => ({ httpsCallable: () => jest.fn() }));

describe("ensurePersonalGroup", () => {
  beforeEach(() => {
    mockSetDoc.mockReset().mockResolvedValue(undefined);
    mockExists = false;
  });

  it("creates the user's personal group when it's missing", async () => {
    await ensurePersonalGroup();
    expect(mockSetDoc).toHaveBeenCalledWith("groups/personal_anna", {
      personal: true, ownerId: "anna", members: ["anna"], createdAt: "<now>",
    });
  });

  it("leaves an existing one alone", async () => {
    mockExists = true;
    await ensurePersonalGroup();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
