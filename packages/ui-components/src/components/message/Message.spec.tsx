import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Message } from "./Message";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const wrap = (ui: React.ReactElement) =>
  render(<CunninghamProvider currentLocale="en-US">{ui}</CunninghamProvider>);

const DATE = new Date("2026-10-19T14:05:00Z");

describe("Message", () => {
  it("lays out avatar, author, timestamp and content", () => {
    const { container } = wrap(
      <Message author="Ada Lovelace" timestamp={DATE}>
        Hello there
      </Message>,
    );
    expect(container.querySelector(".c__avatar")).not.toBeNull();
    expect(container.querySelector(".c__avatar__initials")).toHaveTextContent(
      "AL",
    );
    expect(screen.getByText("Ada Lovelace")).toBeVisible();
    expect(
      container.querySelector(".c__message__content .c__bubble"),
    ).toHaveTextContent("Hello there");
  });

  it("uses a time element with a machine-readable date", () => {
    const { container } = wrap(
      <Message author="Ada" timestamp={DATE}>
        x
      </Message>,
    );
    const time = container.querySelector("time") as HTMLTimeElement;
    expect(time).toHaveAttribute("datetime", DATE.toISOString());
    expect(time.textContent).not.toBe("");
  });

  it("accepts a ready-made timestamp label", () => {
    const { container } = wrap(
      <Message
        author="Ada"
        timestamp="2026-10-19T14:05:00Z"
        timeLabel="2:05 PM"
      >
        x
      </Message>,
    );
    expect(container.querySelector("time")).toHaveTextContent("2:05 PM");
  });

  it("aligns the reader's own messages to the end, in the default bubble variant", () => {
    const { container } = wrap(
      <Message author="Me" own timestamp={DATE}>
        Mine
      </Message>,
    );
    expect(container.querySelector(".c__message")).toHaveClass(
      "c__message--own",
    );
    expect(container.querySelector(".c__bubble")).toHaveClass(
      "c__bubble--default",
      "c__bubble--end",
    );
  });

  it("aligns others' messages to the start, in the muted bubble variant", () => {
    const { container } = wrap(
      <Message author="Ada" timestamp={DATE}>
        Theirs
      </Message>,
    );
    expect(container.querySelector(".c__message")).not.toHaveClass(
      "c__message--own",
    );
    expect(container.querySelector(".c__bubble")).toHaveClass(
      "c__bubble--muted",
      "c__bubble--start",
    );
  });

  it("names the author of an own message for assistive technology", () => {
    wrap(
      <Message author="Me" own timestamp={DATE}>
        Mine
      </Message>,
    );
    expect(screen.getByText("You")).toHaveClass("c__offscreen");
  });

  it("makes its actions reachable by keyboard", async () => {
    wrap(
      <Message author="Ada" timestamp={DATE} actions={<button>Reply</button>}>
        x
      </Message>,
    );
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Reply" })).toHaveFocus();
  });

  it("shows its actions on hover and focus, and always on touch screens", () => {
    expect(scss).toMatch(/&:hover[\s\S]*?&__actions/);
    expect(scss).toMatch(/:focus-within/);
    expect(scss).toMatch(/@media \(hover: none\)/);
  });

  it("can be an error message: the bubble variant is passed through", () => {
    wrap(
      <Message author="Me" own timestamp={DATE} variant="destructive">
        x
      </Message>,
    );
    expect(screen.getByText("Failed to send")).toBeVisible();
  });

  it("takes spacing from tokens, with no literal", () => {
    expect(scss).toContain("--c--components--message--gap");
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
