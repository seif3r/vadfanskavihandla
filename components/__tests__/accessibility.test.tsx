import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import Button from "@/components/Button";
import ErrorText from "@/components/ErrorText";
import Input from "@/components/Input";

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));

describe("accessibility", () => {
  it("announces buttons as buttons, and disabled ones as disabled", () => {
    render(<Button value="Save" disabled />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("labels a field with its placeholder, or with the label given", () => {
    render(
      <>
        <Input value="" onChangeText={jest.fn()} placeholder="Email" />
        <Input value="Hemma" onChangeText={jest.fn()} accessibilityLabel="Group name" />
      </>,
    );
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Group name")).toBeTruthy();
  });

  it("makes errors an alert that screen readers announce", () => {
    render(<ErrorText>Wrong password</ErrorText>);
    const error = screen.getByText("Wrong password");
    expect(error.props.role).toBe("alert");
    expect(error.props.accessibilityLiveRegion).toBe("polite");
  });
});
