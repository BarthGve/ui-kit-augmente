import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Tabs } from ":/components/tabs";
import { DirectionProvider, useDirection } from "./Direction";

const Probe = () => <output>{useDirection()}</output>;

describe("DirectionProvider and useDirection", () => {
  it("is left-to-right by default", () => {
    render(<Probe />);
    expect(screen.getByRole("status")).toHaveTextContent("ltr");
  });

  it("sets dir on a wrapper for its subtree and tells the hook", () => {
    const { container } = render(
      <DirectionProvider direction="rtl">
        <Probe />
      </DirectionProvider>,
    );
    expect(container.querySelector("[dir]")).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("status")).toHaveTextContent("rtl");
  });

  it("does not add a box to the layout", () => {
    const { container } = render(
      <DirectionProvider direction="rtl">
        <span>x</span>
      </DirectionProvider>,
    );
    expect(
      (container.querySelector("[dir]") as HTMLElement).style.display,
    ).toBe("contents");
  });

  it("can be nested to flip a part of the page", () => {
    render(
      <DirectionProvider direction="rtl">
        <DirectionProvider direction="ltr">
          <Probe />
        </DirectionProvider>
      </DirectionProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("ltr");
  });
});

describe("CunninghamProvider direction", () => {
  it("takes a direction and applies it to the whole app", () => {
    const { container } = render(
      <CunninghamProvider direction="rtl">
        <Probe />
      </CunninghamProvider>,
    );
    expect(container.querySelector("[dir='rtl'] .c__app")).not.toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("rtl");
  });

  it("stays as before without a direction", () => {
    const { container } = render(
      <CunninghamProvider>
        <Probe />
      </CunninghamProvider>,
    );
    expect(container.querySelector("[dir]")).toBeNull();
  });
});

describe("arrow keys follow the direction", () => {
  const tabs = [
    { id: "a", label: "Alpha", content: "A" },
    { id: "b", label: "Bravo", content: "B" },
    { id: "c", label: "Charlie", content: "C" },
  ];
  const selected = () =>
    screen
      .getAllByRole("tab")
      .find((t) => t.getAttribute("aria-selected") === "true")!.textContent;

  it("Tabs: ArrowRight goes to the next tab in LTR and to the previous one in RTL", async () => {
    const { unmount } = render(
      <CunninghamProvider>
        <Tabs aria-label="t" tabs={tabs} defaultSelectedTab="b" />
      </CunninghamProvider>,
    );
    screen.getByRole("tab", { name: "Bravo" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveFocus();
    unmount();

    render(
      <CunninghamProvider direction="rtl">
        <Tabs aria-label="t" tabs={tabs} defaultSelectedTab="b" />
      </CunninghamProvider>,
    );
    screen.getByRole("tab", { name: "Bravo" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveFocus();
    expect(selected()).toBeTruthy();
  });
});

describe("the Storybook switch", () => {
  it("exposes a direction toolbar and wraps the stories in the provider", () => {
    const preview = readFileSync(
      resolve(__dirname, "../../../.storybook/preview.tsx"),
      "utf8",
    );
    expect(preview).toMatch(/direction:\s*{/);
    expect(preview).toMatch(/DirectionProvider|direction=/);
  });
});

describe("the audit report", () => {
  it("lists the components that still use physical properties", () => {
    const report = readFileSync(
      resolve(__dirname, "../../../../../docs/rtl-audit.md"),
      "utf8",
    );
    expect(report).toMatch(/^# Right-to-left audit/);
    expect(report).toMatch(/\| Component \| Occurrences \|/);
    expect(report).toMatch(/`modal`/);
  });
});
