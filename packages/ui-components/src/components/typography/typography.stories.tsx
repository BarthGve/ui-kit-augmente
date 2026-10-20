import type { Meta, StoryObj } from "@storybook/react";
import {
  Blockquote,
  Heading,
  InlineCode,
  Text,
  TypographyList,
} from "./Typography";

const meta: Meta<typeof Heading> = {
  title: "Components/Typography",
  component: Heading,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'Headings and text that share the token scale (`ui-tokens` typography is untouched). A `Heading` takes its **style** from `variant` (h1 to h4) and its **level** from `as`, so the outline of the page never depends on the look: `<Heading as="h3" variant="h1">`. `Text` covers body, lead, large, small and muted; plus `Blockquote`, `InlineCode` and `TypographyList`. Use the Storybook theme switch to see the scale in each of the six themes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Scale: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 640 }}>
      <Heading as="h1" variant="h1">
        Heading 1
      </Heading>
      <Heading as="h2" variant="h2">
        Heading 2
      </Heading>
      <Heading as="h3" variant="h3">
        Heading 3
      </Heading>
      <Heading as="h4" variant="h4">
        Heading 4
      </Heading>
      <Text variant="lead">Lead: a larger introduction paragraph.</Text>
      <Text>Body: the default paragraph text, used for most content.</Text>
      <Text variant="large">Large: slightly emphasised text.</Text>
      <Text variant="small">Small: fine print and captions.</Text>
      <Text variant="muted">Muted: secondary, less prominent text.</Text>
      <Blockquote>A quotation set apart from the text around it.</Blockquote>
      <Text>
        Run <InlineCode>yarn build</InlineCode> before publishing.
      </Text>
      <TypographyList>
        <li>First item</li>
        <li>Second item</li>
      </TypographyList>
      <TypographyList ordered>
        <li>Step one</li>
        <li>Step two</li>
      </TypographyList>
    </div>
  ),
};

export const LevelAndStyleApart: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <Heading as="h2" variant="h2">
        Section (level 2)
      </Heading>
      <Heading as="h3" variant="h1">
        A level 3 heading that looks like a title
      </Heading>
      <Heading as="h3" variant="h4">
        A level 3 heading with a small look
      </Heading>
    </div>
  ),
};
