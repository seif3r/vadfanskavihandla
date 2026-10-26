import { Group } from "@/types/models";

// Everyone in any of the groups, as one comparable string: changes only when someone joins or leaves.
export function memberKey(groups: Group[] = []): string {
  return [...new Set(groups.flatMap((group) => group.memberIds))].sort().join(",");
}
