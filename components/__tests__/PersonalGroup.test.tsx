import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import GroupCard from "@/components/GroupCard";
import GroupLists from "@/components/GroupLists";
import "@/i18n";
import { Group } from "@/types/models";

// The theme reads the logged-in user's setting; nobody is logged in here.
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
// GroupCard imports the invites hook, which talks to Firestore; a personal group never shows it.
jest.mock("@/hooks/useInvites", () => ({ useInvites: () => [] }));

const mine: Group = {
  id: "personal_anna", name: "", isPersonal: true, ownerId: "anna", memberIds: ["anna"], removedMemberIds: [],
};
const noop = () => {};

describe("the personal group", () => {
  it("is shown read-only on the groups screen", () => {
    render(
      <GroupCard
        group={mine} members={[{ id: "anna", name: "Anna" }]} removedMembers={[]} userId="anna"
        onRename={noop} onInvite={noop} onRevokeInvite={noop} onRemoveMember={noop}
        onAllowRemovedMember={noop} onLeave={noop} onDelete={noop}
      />,
    );
    expect(screen.getByText("My lists")).toBeTruthy();
    expect(screen.getByText("Only you see the lists here. They can't be shared.")).toBeTruthy();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("is titled My lists in the list overview", () => {
    render(
      <GroupLists
        group={mine} lists={[]} activeListId={undefined} onSelect={noop} canDelete={() => true}
        onCreate={noop} onDelete={noop} isCreating={false} counts={{}}
      />,
    );
    expect(screen.getByText("My lists")).toBeTruthy();
  });
});
