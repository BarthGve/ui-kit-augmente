import type { Meta, StoryObj } from "@storybook/react";
import { ContactImport } from "./ContactImport";

const meta: Meta<typeof ContactImport> = {
  title: "Components/ContactImport",
  component: ContactImport,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Import contacts from a `.csv` or `.xlsx` file (e-mail in the first column, optional name in the second; a header row is skipped). The file is read in the browser, nothing is sent. Rows with an invalid or duplicate address are flagged in text, can be fixed in place or removed, and `onImport` receives only the valid rows. Build on `FileUploader` and `DataGrid`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContactImport>;

export const Default: Story = {
  args: { onImport: (contacts) => console.log("import", contacts) },
};
