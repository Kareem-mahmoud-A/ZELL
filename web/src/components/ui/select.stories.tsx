import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    label: "Select country",
    placeholder: "Select country...",
    options: [
      { label: "United States", value: "us" },
      { label: "Canada", value: "ca" },
      { label: "United Kingdom", value: "uk" },
    ],
  },
};

export const ErrorState: Story = {
  args: {
    label: "Select category",
    placeholder: "Select category...",
    error: "Please choose a category.",
  },
};
