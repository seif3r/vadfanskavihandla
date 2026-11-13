import { describe, expect, it } from "@jest/globals";

import { chunk, MAX_BATCH_WRITES } from "@/helpers/batches";

describe("chunk", () => {
  it("splits into pieces of the given size, in order", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("gives no pieces for an empty list", () => {
    expect(chunk([], 2)).toEqual([]);
  });

  it("keeps each piece within Firestore's batch limit by default", () => {
    const pieces = chunk(Array.from({ length: 1201 }, (_, i) => i));
    expect(pieces.map((piece) => piece.length)).toEqual([MAX_BATCH_WRITES, MAX_BATCH_WRITES, 201]);
  });
});
