import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getInvites, subscribeToInvites } from "@/api/groups";
import { Group } from "@/types/models";

// The group's working invite codes, kept live: a code someone else just made has to show up
// for the owner to be able to revoke it. Only the owner may read them, so mount for owners only.
export function useInvites(group: Group) {
  const queryClient = useQueryClient();
  const groupId = group.id;
  const { data } = useQuery({ queryKey: ["invites", groupId], queryFn: () => getInvites(groupId) });

  useEffect(
    () => subscribeToInvites(groupId, (invites) => queryClient.setQueryData(["invites", groupId], invites)),
    [groupId, queryClient],
  );

  // A code stops working when its creator leaves the group, so there's nothing to revoke.
  return (data ?? []).filter((invite) => group.memberIds.includes(invite.createdBy));
}
