import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: "I agree to the terms and conditions",
  },
};

export const ErrorState: Story = {
  args: {
    label: "Accept newsletter subscription",
    error: "You must accept the newsletter.",
  },
};
