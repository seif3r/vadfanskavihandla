// Firestore takes at most 500 writes in one batch.
export const MAX_BATCH_WRITES = 500;

// Splits a list into pieces of at most `size`, in order. Used to stay under batch limits.
export function chunk<T>(list: T[], size = MAX_BATCH_WRITES): T[][] {
  const pieces: T[][] = [];
  for (let i = 0; i < list.length; i += size) pieces.push(list.slice(i, i + size));
  return pieces;
}
