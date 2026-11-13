import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import Join from "@/app/join";
import "@/i18n";

const CODE = "AbCdEfGhIj0123456789";
const mockJoinGroup = jest.fn<(code: string) => Promise<void>>();
let mockParams: { code?: string | string[] } = {};

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
jest.mock("@/hooks/useGroups", () => ({ useGroups: () => ({ joinGroup: mockJoinGroup }) }));
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: jest.fn() }),
}));

// The first render loads React Native's components, which is slow on a cold CI runner.
jest.setTimeout(20000);

describe("Join", () => {
  beforeEach(() => {
    mockJoinGroup.mockReset().mockResolvedValue(undefined);
    mockParams = {};
  });

  it("uses the first code when a link has two", async () => {
    mockParams = { code: [CODE, "other"] };
    render(<Join />);
    fireEvent.press(screen.getByText("Join"));
    await waitFor(() => expect(mockJoinGroup).toHaveBeenCalledWith(CODE));
  });

  it("joins with the code from a pasted message", async () => {
    render(<Join />);
    fireEvent.changeText(screen.getByPlaceholderText("Invite code"), `Invite code: ${CODE} (valid for 7 days)`);
    fireEvent.press(screen.getByText("Join"));
    await waitFor(() => expect(mockJoinGroup).toHaveBeenCalledWith(CODE));
  });

  it("says what a code looks like when there is none", () => {
    render(<Join />);
    fireEvent.changeText(screen.getByPlaceholderText("Invite code"), "abc");
    fireEvent.press(screen.getByText("Join"));
    expect(screen.getByText("An invite code is 20 letters and digits")).toBeTruthy();
    expect(mockJoinGroup).not.toHaveBeenCalled();
  });
});
