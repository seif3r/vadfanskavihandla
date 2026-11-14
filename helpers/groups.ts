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

// The id of a user's personal group ("My lists"). firestore.rules builds the same id.
export function personalGroupId(userId: string): string {
  return `personal_${userId}`;
}

// What to call a group on screen: a personal group has no name of its own, so it's translated.
export function groupName(group: Group, t: (key: "lists.personal") => string): string {
  return group.isPersonal ? t("lists.personal") : group.name;
}

// The personal group first, then the shared ones in the order they came.
export function personalFirst(groups: Group[]): Group[] {
  return [...groups.filter((g) => g.isPersonal), ...groups.filter((g) => !g.isPersonal)];
}
