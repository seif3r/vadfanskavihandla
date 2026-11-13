import { Group } from "@/types/models";

// Everyone in any of the groups, as one comparable string: changes only when someone joins or leaves.
export function memberKey(groups: Group[] = []): string {
  return [...new Set(groups.flatMap((group) => group.memberIds))].sort().join(",");
}

// An invite code is a Firestore document id: 20 letters and digits (the joinGroup function checks
// the same). Finds it in whatever was pasted, so the whole shared message works too ("Join my
// group ... Invite code: AbC...").
export function findInviteCode(text: string): string | null {
  return text.match(/(?<![A-Za-z0-9])[A-Za-z0-9]{20}(?![A-Za-z0-9])/)?.[0] ?? null;
}
