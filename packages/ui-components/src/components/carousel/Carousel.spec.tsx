import { readFileSync } from "fs";
import { resolve } from "path";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Carousel, CarouselProps } from "./Carousel";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const setup = (props: Partial<CarouselProps> = {}) =>
  render(
    <CunninghamProvider currentLocale="en-US">
      <Carousel aria-label="Featured" {...props}>
        <p>Alpha</p>
        <p>Beta</p>
        <p>Gamma</p>
      </Carousel>
    </CunninghamProvider>,
  );
const region = () => screen.getByRole("region", { name: "Featured" });
// Slides out of view are aria-hidden, so they have no accessible name to query by.
const slides = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[aria-roledescription="slide"]'),
  );
const next = () => screen.getByRole("button", { name: "Next slide" });
const prev = () => screen.getByRole("button", { name: "Previous slide" });
const current = () =>
  slides().findIndex((s) => s.getAttribute("data-current") === "true");

describe("Carousel", () => {
  it("is a labelled carousel region with a labelled group per slide", () => {
    setup();
    expect(region()).toHaveAttribute("aria-roledescription", "carousel");
    expect(slides()).toHaveLength(3);
    slides().forEach((s, i) => {
      expect(s).toHaveAttribute("aria-roledescription", "slide");
      expect(s).toHaveAttribute("aria-label", `${i + 1} of 3`);
    });
  });

  it("shows the first slide and moves with the previous and next buttons", async () => {
    setup();
    expect(current()).toBe(0);
    expect(prev()).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(next());
    expect(current()).toBe(1);
    await userEvent.click(next());
    expect(current()).toBe(2);
    expect(next()).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(prev());
    expect(current()).toBe(1);
  });

  it("moves between slides with the arrow keys", async () => {
    setup();
    next().focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(current()).toBe(1);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(current()).toBe(2);
    await userEvent.keyboard("{ArrowLeft}");
    expect(current()).toBe(1);
    await userEvent.keyboard("{Home}");
    expect(current()).toBe(0);
    await userEvent.keyboard("{End}");
    expect(current()).toBe(2);
  });

  it("offers indicators that name and go to a slide", async () => {
    setup();
    const dots = within(
      screen.getByRole("group", { name: "Slides" }),
    ).getAllByRole("button");
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute("aria-current", "true");
    await userEvent.click(dots[2]);
    expect(current()).toBe(2);
    expect(dots[2]).toHaveAttribute("aria-current", "true");
    expect(dots[0]).not.toHaveAttribute("aria-current");
  });

  it("can hide the indicators", () => {
    setup({ indicators: false });
    expect(screen.queryByRole("group", { name: "Slides" })).toBeNull();
  });

  it("loops when asked", async () => {
    setup({ loop: true });
    expect(prev()).not.toHaveAttribute("aria-disabled");
    await userEvent.click(prev());
    expect(current()).toBe(2);
    await userEvent.click(next());
    expect(current()).toBe(0);
  });

  it("only the current slide is exposed to assistive technology", () => {
    setup();
    expect(slides()[0]).not.toHaveAttribute("aria-hidden");
    expect(slides()[1]).toHaveAttribute("aria-hidden", "true");
  });

  it("calls onChange with the slide index", async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.click(next());
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  describe("autoplay", () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: false }));
    afterEach(() => vi.useRealTimers());
    const tick = (ms: number) =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });

    it("advances on its own and can be paused", async () => {
      setup({ autoPlay: true, interval: 1000 });
      await tick(1100);
      expect(current()).toBe(1);
      fireEventPause();
      await tick(3000);
      expect(current()).toBe(1);
    });

    const fireEventPause = () =>
      act(() =>
        screen
          .getByRole("button", { name: "Pause automatic slide show" })
          .click(),
      );

    it("announces slides politely only when it is not rotating", async () => {
      setup({ autoPlay: true, interval: 1000 });
      expect(screen.getByTestId("carousel-live")).toHaveAttribute(
        "aria-live",
        "off",
      );
      fireEventPause();
      expect(screen.getByTestId("carousel-live")).toHaveAttribute(
        "aria-live",
        "polite",
      );
    });

    it("stops while the carousel has focus", async () => {
      setup({ autoPlay: true, interval: 1000 });
      act(() => next().focus());
      await tick(3000);
      expect(current()).toBe(0);
    });

    it("does not rotate when the user prefers reduced motion", async () => {
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query.includes("reduce"),
        addEventListener() {},
        removeEventListener() {},
      }));
      setup({ autoPlay: true, interval: 1000 });
      await tick(3000);
      expect(current()).toBe(0);
      vi.unstubAllGlobals();
    });
  });

  it("uses native scroll-snap and drops animation under reduced motion, with no literal", () => {
    expect(scss).toMatch(/scroll-snap-type:\s*x mandatory/);
    expect(scss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?scroll-behavior:\s*auto/,
    );
    for (const token of [
      "control-size",
      "indicator-color",
      "indicator-color--current",
    ]) {
      expect(scss).toContain(`--c--components--carousel--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
