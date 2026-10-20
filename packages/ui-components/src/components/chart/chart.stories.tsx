import type { Meta, StoryObj } from "@storybook/react";
import { Chart } from "./Chart";

const DATA = [
  { month: "Jan", sales: 12, costs: 8, returns: 2 },
  { month: "Feb", sales: 18, costs: 9, returns: 3 },
  { month: "Mar", sales: 9, costs: 11, returns: 1 },
  { month: "Apr", sales: 15, costs: 10, returns: 4 },
];

const meta: Meta<typeof Chart> = {
  title: "Components/Chart",
  component: Chart,
  tags: ["autodocs"],
  args: {
    title: "Monthly results",
    summary:
      "Sales peak in February at 18 and fall in March; costs stay between 8 and 11.",
    data: DATA,
    xKey: "month",
    series: [
      { key: "sales", label: "Sales" },
      { key: "costs", label: "Costs" },
    ],
  },
  parameters: {
    docs: {
      description: {
        component:
          "Bar, line and area charts drawn in SVG from a data array, with axes, a legend and a tooltip, themed by the `chart` tokens in the six themes. No charting library (so no new dependency). **Text alternative**: the graphic is named by `title` and described by `summary`, and a button swaps the chart for the same data as a table. **Not by colour alone**: each series has its own texture (bars, areas), marker and dash (lines), repeated in the legend, and the series colours keep at least 3:1 against the surface. **Keyboard**: the plot takes the focus; arrows, Home and End walk through the categories and the values are announced. It follows the width of its container; there is no animation to reduce.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chart>;

export const Bar: Story = {};
export const Line: Story = { args: { type: "line" } };
export const Area: Story = { args: { type: "area" } };
export const ThreeSeries: Story = {
  args: {
    series: [
      { key: "sales", label: "Sales" },
      { key: "costs", label: "Costs" },
      { key: "returns", label: "Returns" },
    ],
  },
};
