import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
    label: "Username",
    helperText: "Choose a unique username.",
  },
};

export const ErrorState: Story = {
  args: {
    placeholder: "Enter email...",
    label: "Email Address",
    error: "Invalid email address entered.",
    defaultValue: "invalid-email",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Cannot edit this",
    label: "Locked Field",
    disabled: true,
  },
};
