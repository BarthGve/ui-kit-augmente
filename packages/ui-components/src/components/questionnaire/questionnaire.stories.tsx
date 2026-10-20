import type { Meta, StoryObj } from "@storybook/react";
import { Questionnaire, QuestionnaireItem } from "./Questionnaire";

const ITEMS: QuestionnaireItem[] = [
  {
    id: "role",
    type: "single",
    label: "What is your role?",
    required: true,
    options: [
      { value: "dev", label: "Developer" },
      { value: "design", label: "Designer" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    id: "tools",
    type: "multiple",
    label: "Which tools do you use?",
    options: [
      { value: "figma", label: "Figma" },
      { value: "git", label: "Git" },
      { value: "storybook", label: "Storybook" },
    ],
  },
  {
    id: "notes",
    type: "text",
    label: "Anything else you would like to tell us?",
  },
];

const meta: Meta<typeof Questionnaire> = {
  title: "Components/Questionnaire",
  component: Questionnaire,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "One question at a time, with Previous, Next, Skip (optional questions) and Submit. Question types: `single` choice, `multiple` choice and free `text`. Each question is a `fieldset` with a `legend`; the others stay in the page but inert, and the answers are read from the form when the last question is submitted. A `required` question blocks Next until answered, shows the error in text, marks its controls `aria-invalid` and puts the focus back on the first one. When moving on, the focus goes to the new question. The progress is a named progress bar. `step` / `onStepChange` control the navigation.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Questionnaire>;

export const Default: Story = {
  args: {
    "aria-label": "Survey",
    items: ITEMS,
    onSubmit: (answers) => console.log("answers", answers),
  },
};
