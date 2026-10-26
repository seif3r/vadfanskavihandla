import { useMutation, useQuery } from "@tanstack/react-query";

import {
  acceptInvite, createGroup, createInvite, deleteGroup, getGroups, leaveGroup, removeMember, renameGroup,
} from "@/api/groups";
import { getUsers } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { Group, Member } from "@/types/models";

// The user's groups, their members' names, and managing them. No refetch after changes:
// useLiveUpdates writes every change to the groups into the cache.
// The mutations are async so screens can show the translated error if one fails.
export function useGroups() {
  const { user } = useAuth();
  const groupsQuery = useQuery({ queryKey: ["groups"], queryFn: getGroups, enabled: !!user });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: getUsers, enabled: !!user });

  const create = useMutation({ mutationFn: createGroup });
  const rename = useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => renameGroup(id, name) });
  const leave = useMutation({ mutationFn: leaveGroup });
  const remove = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) => removeMember(groupId, userId),
  });
  const deleteMutation = useMutation({ mutationFn: deleteGroup });
  const join = useMutation({ mutationFn: acceptInvite });

  const users = usersQuery.data ?? [];
  // Someone who just joined has no name until the users refetch is done.
  const membersOf = (group: Group): Member[] =>
    group.memberIds.map((id) => users.find((u) => u.id === id) ?? { id, name: "…" });

  return {
    groups: groupsQuery.data ?? [],
    isLoading: groupsQuery.isLoading,
    membersOf,
    createGroup: create.mutateAsync,
    isCreating: create.isPending,
    renameGroup: (group: Group, name: string) => rename.mutateAsync({ id: group.id, name }),
    leaveGroup: leave.mutateAsync,
    removeMember: (group: Group, userId: string) => remove.mutateAsync({ groupId: group.id, userId }),
    deleteGroup: (group: Group) => deleteMutation.mutateAsync(group.id),
    createInvite: (group: Group) => createInvite(group.id, group.name),
    joinGroup: join.mutateAsync,
  };
}
