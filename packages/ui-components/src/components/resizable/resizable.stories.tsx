import type { Meta, StoryObj } from "@storybook/react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./Resizable";

const meta: Meta<typeof ResizablePanelGroup> = {
  title: "Components/Resizable",
  component: ResizablePanelGroup,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Panels with draggable handles, built on `react-resizable-panels` (the library `MainLayout` already uses) and the `resize-handle` style. Give each panel an `id` and its `minSize` / `maxSize` (numbers are pixels, strings without unit are percent). The handle is a `separator` with an accessible name and `aria-valuenow`; the keyboard moves it (arrows, Home and End) and a double click resets the panels to their default size. Sizes are controlled with `layout` and `onResize`, or start from `defaultLayout`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResizablePanelGroup>;

const box = { display: "grid", placeItems: "center", height: "100%" } as const;

export const Horizontal: Story = {
  render: () => (
    <div
      style={{
        width: 560,
        height: 240,
        border: "1px solid var(--c--contextuals--border--surface--primary)",
      }}
    >
      <ResizablePanelGroup>
        <ResizablePanel id="nav" defaultSize="30" minSize="15" maxSize="60">
          <div style={box}>Navigation</div>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize the navigation" />
        <ResizablePanel id="content">
          <div style={box}>Content</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div
      style={{
        width: 360,
        height: 300,
        border: "1px solid var(--c--contextuals--border--surface--primary)",
      }}
    >
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel id="top" defaultSize="60" minSize="20">
          <div style={box}>Top</div>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize the top panel" />
        <ResizablePanel id="bottom">
          <div style={box}>Bottom</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const ThreePanels: Story = {
  render: () => (
    <div
      style={{
        width: 640,
        height: 200,
        border: "1px solid var(--c--contextuals--border--surface--primary)",
      }}
    >
      <ResizablePanelGroup>
        <ResizablePanel id="a" defaultSize="25" minSize="10">
          <div style={box}>A</div>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize A" />
        <ResizablePanel id="b" defaultSize="50" minSize="20">
          <div style={box}>B</div>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize B" />
        <ResizablePanel id="c" defaultSize="25" minSize="10">
          <div style={box}>C</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};
