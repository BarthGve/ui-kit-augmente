import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./Resizable";

// Dragging and keys need real layout: they are covered in a browser by
// e2e/resizable. Here, the markup.
const setup = (handleProps = {}) =>
  render(
    <CunninghamProvider currentLocale="en-US">
      <ResizablePanelGroup>
        <ResizablePanel id="left" minSize="20" maxSize="80">
          Left
        </ResizablePanel>
        <ResizableHandle {...handleProps} />
        <ResizablePanel id="right">Right</ResizablePanel>
      </ResizablePanelGroup>
    </CunninghamProvider>,
  );

describe("Resizable", () => {
  it("renders the panels around a separator that has a name", () => {
    setup();
    expect(screen.getByText("Left")).toBeVisible();
    expect(screen.getByText("Right")).toBeVisible();
    expect(
      screen.getByRole("separator", { name: "Resize" }),
    ).toBeInTheDocument();
  });

  it("takes another name for the handle", () => {
    setup({ "aria-label": "Resize the sidebar" });
    expect(
      screen.getByRole("separator", { name: "Resize the sidebar" }),
    ).toBeInTheDocument();
  });

  it("reuses the resize-handle styling and the group classes", () => {
    const { container } = setup();
    expect(screen.getByRole("separator")).toHaveClass(
      "c__resize-handle",
      "c__resize-handle--interactive",
    );
    expect(container.querySelector(".c__resizable--horizontal")).not.toBeNull();
  });
});
