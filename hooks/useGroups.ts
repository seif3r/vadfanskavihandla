import { useMutation, useQuery } from "@tanstack/react-query";

import {
  acceptInvite, allowRemovedMember, createGroup, createInvite, deleteGroup, deleteInvite, getGroups, leaveGroup,
  removeMember, renameGroup,
} from "@/api/groups";
import { getUsers } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { RemoveMemberRequest, RenameGroupRequest } from "@/types/api";
import { Group, Member } from "@/types/models";

// The user's groups, their members' names, and managing them. No refetch after changes:
// useLiveUpdates writes every change to the groups into the cache.
// The mutations are async so screens can show the translated error if one fails.
export function useGroups() {
  const { user } = useAuth();
  const groupsQuery = useQuery({ queryKey: ["groups"], queryFn: getGroups, enabled: !!user });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: getUsers, enabled: !!user });

  const create = useMutation({ mutationFn: createGroup });
  const rename = useMutation({ mutationFn: ({ groupId, name }: RenameGroupRequest) => renameGroup(groupId, name) });
  const leave = useMutation({ mutationFn: leaveGroup });
  const remove = useMutation({
    mutationFn: ({ groupId, userId }: RemoveMemberRequest) => removeMember(groupId, userId),
  });
  const allowRemoved = useMutation({
    mutationFn: ({ groupId, userId }: RemoveMemberRequest) => allowRemovedMember(groupId, userId),
  });
  const deleteMutation = useMutation({ mutationFn: deleteGroup });
  const invite = useMutation({ mutationFn: (group: Group) => createInvite(group.id, group.name) });
  const revokeInvite = useMutation({ mutationFn: deleteInvite });
  const join = useMutation({ mutationFn: acceptInvite });

  const users = usersQuery.data ?? [];
  // Someone who just joined has no name until the users refetch is done.
  const withNames = (ids: string[]): Member[] =>
    ids.map((id) => users.find((u) => u.id === id) ?? { id, name: "…" });

  return {
    groups: groupsQuery.data ?? [],
    isLoading: groupsQuery.isLoading,
    membersOf: (group: Group) => withNames(group.memberIds),
    removedMembersOf: (group: Group) => withNames(group.removedMemberIds),
    createGroup: create.mutateAsync,
    isCreating: create.isPending,
    renameGroup: (group: Group, name: string) => rename.mutateAsync({ groupId: group.id, name }),
    leaveGroup: leave.mutateAsync,
    removeMember: (group: Group, userId: string) => remove.mutateAsync({ groupId: group.id, userId }),
    allowRemovedMember: (group: Group, userId: string) => allowRemoved.mutateAsync({ groupId: group.id, userId }),
    deleteGroup: (group: Group) => deleteMutation.mutateAsync(group.id),
    createInvite: invite.mutateAsync,
    revokeInvite: revokeInvite.mutateAsync,
    joinGroup: join.mutateAsync,
  };
}
