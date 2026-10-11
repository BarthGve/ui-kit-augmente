import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";

import { LaGaufre } from "./LaGaufre";
import { LaGaufreV2 } from "./LaGaufreV2";

const meta = {
  title: "Components/LaGaufreV2",
  component: LaGaufreV2,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LaGaufre>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    widgetPath: "https://static.suite.anct.gouv.fr/widgets/lagaufre.js",
    apiUrl: "https://lasuite.numerique.gouv.fr/api/services",
  },
  render: (args) => {
    return (
      <div
        style={{ width: "100vw", display: "flex", justifyContent: "center" }}
      >
        <LaGaufreV2 {...args} />
      </div>
    );
  },
};

export const BottomLeft: Story = {
  args: {
    widgetPath: "https://static.suite.anct.gouv.fr/widgets/lagaufre.js",
    apiUrl: "https://lasuite.numerique.gouv.fr/api/services",
  },
  render: (args) => {
    return (
      <div
        style={{
          width: "80vw",
          height: "80vh",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          padding: "30px",
        }}
      >
        <LaGaufreV2 {...args} />
      </div>
    );
  },
};

const centered = (args: Story["args"]) => (
  <div style={{ width: "100vw", display: "flex", justifyContent: "center" }}>
    <LaGaufreV2 {...args} />
  </div>
);

/**
 * Closed: the button only. `data` replaces the API call, so rendering the
 * button needs no request; the widget script itself still comes from
 * `widgetPath` (the panel lists nothing here).
 */
export const Closed: Story = {
  args: { data: { services: [] } },
  render: centered,
};

/**
 * Open: the panel is drawn by the **remote widget** (script from `widgetPath`,
 * services from `apiUrl`: network required) in
 * `#lasuite-widget-lagaufre-shadow`; the widget sets `aria-expanded`.
 * Storybook only: the unit tests replace the widget and never load it.
 */
export const Open: Story = {
  args: Default.args,
  render: centered,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button");
    // The widget listens on the button once it has drawn its (hidden) panel.
    await waitFor(
      () =>
        expect(
          document
            .getElementById("lasuite-widget-lagaufre-shadow")
            ?.shadowRoot?.getElementById("wrapper"),
        ).toBeTruthy(),
      { timeout: 10000 },
    );
    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute("aria-expanded", "true"));
  },
};
