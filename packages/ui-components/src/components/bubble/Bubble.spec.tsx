import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Bubble, BubbleGroup, BubbleReactions } from "./Bubble";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const wrap = (ui: React.ReactElement) =>
  render(<CunninghamProvider currentLocale="en-US">{ui}</CunninghamProvider>);

describe("Bubble", () => {
  it("renders its content, aligned to the start by default", () => {
    const { container } = wrap(<Bubble>Hello</Bubble>);
    const el = container.querySelector(".c__bubble") as HTMLElement;
    expect(el).toHaveTextContent("Hello");
    expect(el).toHaveClass("c__bubble--default", "c__bubble--start");
  });

  it.each([
    "default",
    "secondary",
    "muted",
    "tinted",
    "outline",
    "ghost",
    "destructive",
  ] as const)("has the %s variant", (variant) => {
    const { container } = wrap(<Bubble variant={variant}>x</Bubble>);
    expect(container.querySelector(".c__bubble")).toHaveClass(
      `c__bubble--${variant}`,
    );
  });

  it("aligns to the end", () => {
    const { container } = wrap(<Bubble align="end">x</Bubble>);
    expect(container.querySelector(".c__bubble")).toHaveClass("c__bubble--end");
  });

  it("can be a link", () => {
    wrap(<Bubble href="/thread/1">See thread</Bubble>);
    expect(screen.getByRole("link", { name: "See thread" })).toHaveAttribute(
      "href",
      "/thread/1",
    );
  });

  it("can be a button, operable with click, Enter and Space", async () => {
    const onPress = vi.fn();
    wrap(<Bubble onPress={onPress}>Reply</Bubble>);
    const button = screen.getByRole("button", { name: "Reply" });
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it("states the error in text, not by colour only", () => {
    wrap(<Bubble variant="destructive">Could not send</Bubble>);
    expect(screen.getByText("Failed to send")).toBeVisible();
  });

  it("takes another error text", () => {
    wrap(
      <Bubble variant="destructive" errorText="Offline">
        x
      </Bubble>,
    );
    expect(screen.getByText("Offline")).toBeVisible();
    expect(screen.queryByText("Failed to send")).toBeNull();
  });

  it("caps its width at 80% of the container, from tokens", () => {
    expect(scss).toContain("--c--components--bubble--max-width");
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});

describe("BubbleGroup", () => {
  it("groups consecutive bubbles", () => {
    const { container } = wrap(
      <BubbleGroup align="end">
        <Bubble align="end">One</Bubble>
        <Bubble align="end">Two</Bubble>
      </BubbleGroup>,
    );
    const group = container.querySelector(".c__bubble-group") as HTMLElement;
    expect(group).toHaveClass("c__bubble-group--end");
    expect(group.querySelectorAll(".c__bubble")).toHaveLength(2);
  });
});

describe("BubbleReactions", () => {
  const reactions = [
    { emoji: "👍", count: 3 },
    { emoji: "❤️", count: 1, label: "heart" },
  ];

  it("is a labelled group", () => {
    wrap(<BubbleReactions reactions={reactions} />);
    const group = screen.getByRole("group", { name: "Reactions" });
    expect(within(group).getAllByRole("listitem")).toHaveLength(2);
  });

  it("names each reaction for assistive technology", () => {
    wrap(<BubbleReactions reactions={reactions} />);
    expect(screen.getByLabelText("👍, 3")).toBeVisible();
    expect(screen.getByLabelText("heart, 1")).toBeVisible();
  });

  it("takes another group label", () => {
    wrap(
      <BubbleReactions
        aria-label="Reactions to Ada's message"
        reactions={reactions}
      />,
    );
    expect(
      screen.getByRole("group", { name: "Reactions to Ada's message" }),
    ).toBeVisible();
  });
});
