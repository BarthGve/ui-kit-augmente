import type { Meta, StoryObj } from "@storybook/react";
import { InputOTP } from "./index";

const meta: Meta<typeof InputOTP> = {
  title: "Components/Forms/InputOTP",
  component: InputOTP,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'One-time-code input, drawn as `length` slots over one real text field: typing fills the slots, Backspace goes back, a paste fills them all (digits only unless `type="text"`), and the browser or the phone can autofill it (`autocomplete="one-time-code"`). `onComplete` fires once each time every slot is filled. It uses the `Field` label, text and states.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InputOTP>;

export const Default: Story = { args: { label: "Verification code" } };

export const WithGroups: Story = {
  args: { label: "Verification code", length: 6, groups: [3, 3] },
};

export const Error: Story = {
  args: {
    label: "Verification code",
    defaultValue: "123456",
    state: "error",
    text: "This code is not valid",
  },
};

export const Disabled: Story = {
  args: { label: "Verification code", defaultValue: "1234", disabled: true },
};

export const TextCode: Story = {
  args: { label: "Recovery code", length: 8, groups: [4, 4], type: "text" },
};
