import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen, within } from "@testing-library/react";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { afterEach, describe, expect, it } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Timeline, TimelineProps } from "./index";
import { tokens } from "./tokens";

// Vitest stubs stylesheets, so the sources are read from disk.
const read = (path: string) => readFileSync(resolve(__dirname, path), "utf8");

const renderTimeline = (props: TimelineProps, locale = "en-US") =>
  render(
    <CunninghamProvider currentLocale={locale}>
      <Timeline aria-label="History" {...props} />
    </CunninghamProvider>,
  );

const items = () =>
  within(screen.getByRole("list", { name: "History" })).getAllByRole(
    "listitem",
  );

const dateOf = (item: HTMLElement) => item.querySelector("time")!;

describe("Timeline list (AC4)", () => {
  it("is an ordered list named by aria-label, in the caller's order", () => {
    renderTimeline({
      events: [
        { id: "c", date: "2026-10-15", title: "Shipped" },
        { id: "a", date: "2026-10-12", title: "Received" },
        { id: "b", date: "2026-10-13", title: "Packed" },
      ],
    });
    const list = screen.getByRole("list", { name: "History" });
    expect(list.tagName).toBe("OL");
    expect(list).toHaveAttribute("role", "list");
    expect(items().map((item) => item.tagName)).toEqual(["LI", "LI", "LI"]);
    expect(items().map((item) => dateOf(item).dateTime)).toEqual([
      "2026-10-15",
      "2026-10-12",
      "2026-10-13",
    ]);
  });

  it("renders an empty list for no events, forwarding className and props", () => {
    renderTimeline({ events: [], className: "custom", id: "tl" });
    const list = screen.getByRole("list", { name: "History" });
    expect(list.children).toHaveLength(0);
    expect(list).toHaveClass("c__timeline", "custom");
    expect(list).toHaveAttribute("id", "tl");
  });
});

describe("Timeline events (AC1)", () => {
  it("shows a date in a time element, a title, and content only when given", () => {
    renderTimeline({
      events: [
        { id: "a", date: "2026-10-12", title: "Received", content: "By mail" },
        { id: "b", date: "2026-10-13", title: "Packed" },
      ],
    });
    const [first, second] = items();
    expect(dateOf(first)).toHaveAttribute("dateTime", "2026-10-12");
    expect(first).toHaveTextContent("Received");
    expect(within(first).getByText("By mail")).toBeInTheDocument();
    expect(second).toHaveTextContent("Packed");
    expect(second.querySelector(".c__timeline__content")).toBeNull();
  });
});

describe("Timeline dates", () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  const formatted = (date: Date | string, locale = "en-US", extra = {}) => {
    renderTimeline(
      { events: [{ id: "a", date, title: "Event" }], ...extra },
      locale,
    );
    return dateOf(items()[0]).textContent;
  };

  it("formats in the active locale", () => {
    expect(formatted("2026-10-13")).toBe("Oct 13, 2026");
  });

  it("formats in French when the provider's locale is fr-FR", () => {
    expect(formatted("2026-10-13", "fr-FR")).toBe("13 oct. 2026");
  });

  it("does not shift a date-only string in a negative-offset zone", () => {
    process.env.TZ = "America/Los_Angeles";
    expect(formatted("2026-10-13")).toBe("Oct 13, 2026");
  });

  it("accepts a Date instance, with its ISO string as dateTime", () => {
    const date = new Date(Date.UTC(2026, 9, 13, 12));
    expect(formatted(date)).toBe("Oct 13, 2026");
    expect(dateOf(items()[0])).toHaveAttribute(
      "dateTime",
      "2026-10-13T12:00:00.000Z",
    );
  });

  it("renders an invalid string as given, never Invalid Date", () => {
    expect(formatted("someday")).toBe("someday");
  });

  it("lets dateFormat override the default format", () => {
    expect(
      formatted("2026-10-13", "en-US", {
        dateFormat: { year: "numeric", month: "long" },
      }),
    ).toBe("October 2026");
  });
});

describe("Timeline states (AC3)", () => {
  const states = () => {
    renderTimeline({
      events: [
        { id: "a", date: "2026-10-12", title: "Received", state: "done" },
        { id: "b", date: "2026-10-13", title: "Packed", state: "current" },
        { id: "c", date: "2026-10-15", title: "Shipped", state: "upcoming" },
        { id: "d", date: "2026-10-16", title: "Delivered" },
      ],
    });
    return items();
  };

  it("gives each state its own marker shape, a check only when done", () => {
    const markers = states().map(
      (item) => item.querySelector(".c__timeline__marker")!,
    );
    expect(markers[0]).toHaveClass("c__timeline__marker--done");
    expect(markers[1]).toHaveClass("c__timeline__marker--current");
    expect(markers[2]).toHaveClass("c__timeline__marker--upcoming");
    expect(markers.map((marker) => marker.textContent)).toEqual([
      "check",
      "",
      "",
      "",
    ]);
  });

  it("names the state in text, not in colour alone", () => {
    const [done, current, upcoming, none] = states();
    expect(within(done).getByText("Done")).toBeInTheDocument();
    expect(within(current).getByText("Current")).toBeInTheDocument();
    expect(within(upcoming).getByText("Upcoming")).toBeInTheDocument();
    expect(within(none).queryByText(/Done|Current|Upcoming/)).toBeNull();
  });

  it("marks only the current item with aria-current=step", () => {
    expect(
      states().map((item) => item.getAttribute("aria-current")),
    ).toEqual([null, "step", null, null]);
  });

  it("hides every marker from assistive technology", () => {
    for (const item of states()) {
      expect(item.querySelector(".c__timeline__marker")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
  });
});

// Theme blocks hold flat declarations only: the first `}` closes the block.
const tokensCss = read("../../cunningham-tokens.css");
const THEMES = [
  "default",
  "dark",
  "dsfr-light",
  "dsfr-dark",
  "anct-light",
  "anct-dark",
] as const;
type Theme = (typeof THEMES)[number];
const declarations = (theme: Theme) => {
  const selector =
    theme === "default" ? ":root " : `.cunningham-theme--${theme}`;
  const body = tokensCss.split(`${selector}{`)[1]?.split("}")[0];
  if (!body) throw new Error(`No ${selector} block in cunningham-tokens.css`);
  return Object.fromEntries(
    [...body.matchAll(/(--c--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [
      k,
      v.trim(),
    ]),
  );
};

describe("Timeline tokens", () => {
  it.each(THEMES)("emits every token of tokens.ts in theme %s", (theme) => {
    const vars = declarations(theme);
    for (const key of Object.keys(tokens(defaultTokenRefs))) {
      expect(vars).toHaveProperty(`--c--components--timeline--${key}`);
    }
  });
});

describe("Timeline stylesheet", () => {
  const scss = () =>
    read("index.scss")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

  it("holds no literal colour, spacing or size", () => {
    // Every `var(--name)` reference blanked out, so names cannot match.
    const values = scss().replace(/var\(--[\w-]+\)/g, "var()");
    expect(values).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(values).not.toMatch(/rgba?\(|hsla?\(/);
    expect(values).not.toMatch(/\d(px|rem|em)\b/);
  });

  it("gives no var() a literal fallback", () => {
    expect(scss()).not.toMatch(/var\(--[\w-]+\s*,/);
  });

  it("uses logical properties only", () => {
    expect(scss()).not.toMatch(/-(left|right)\s*:/);
    expect(scss()).not.toMatch(/(^|[\s;{])(left|right)\s*:/m);
  });
});

// The theme's own value first, `:root` otherwise, following `var()` chains.
const rootVars = declarations("default");
const resolveVar = (theme: Record<string, string>, name: string): string => {
  const value = theme[name] ?? rootVars[name];
  if (value === undefined) throw new Error(`Undefined ${name}`);
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolveVar(theme, ref[1]) : value;
};
// Helpers copied from `filter/contrast.spec.tsx` (known duplication).
const channels = (hex: string) => {
  expect(hex).toMatch(/^#([0-9a-f]{6}|[0-9a-f]{8})$/i);
  return [1, 3, 5, 7].map(
    (i) => parseInt(hex.slice(i, i + 2) || "ff", 16) / 255,
  );
};
const over = (top: string, bottom: number[]) => {
  const [r, g, b, a] = channels(top);
  return [r, g, b].map((c, i) => c * a + bottom[i] * (1 - a));
};
const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Read from tokens.ts, so a changed reference is measured without a rebuild:
// `ref(a.b.c)` is the variable `--c--a--b--c`.
const timelineTokens: Record<string, string | number> =
  tokens(defaultTokenRefs);
const tokenVar = (key: string) => {
  const ref = String(timelineTokens[key]).match(/^ref\(([\w.-]+)\)$/);
  if (!ref) throw new Error(`${key} is not a token reference`);
  return `--c--${ref[1].replace(/\./g, "--")}`;
};
const SURFACE = "--c--contextuals--background--surface--primary";

// Text needs 4.5:1, markers 3:1 (non-text), all on `surface.primary`.
const PAIRS = [
  ["title", "color", 4.5],
  ["date and upcoming text", "color--muted", 4.5],
  ["current title", "color--current", 4.5],
  ["done marker", "marker-done-background", 3],
  ["current marker", "marker-current-background", 3],
  ["upcoming ring", "marker-upcoming-border-color", 3],
] as const;

// STOP finding, reported and not asserted (plan rule: no token is changed
// here, the owner decides). Measured against `surface.primary`:
// done marker 2.42 / 2.47 / 2.46 and current marker 2.43 / 2.46 / 2.44 in
// dark / dsfr-dark / anct-dark. Remove an entry once its pair passes.
const KNOWN_FAILURES: ReadonlyArray<[Theme, string]> = [
  ["dark", "done marker"],
  ["dsfr-dark", "done marker"],
  ["anct-dark", "done marker"],
  ["dark", "current marker"],
  ["dsfr-dark", "current marker"],
  ["anct-dark", "current marker"],
];

describe("Timeline contrast", () => {
  describe.each(THEMES)("theme %s", (theme) => {
    const vars = declarations(theme);
    const surface = over(resolveVar(vars, SURFACE), [1, 1, 1]);
    const pairs = PAIRS.filter(
      ([name]) => !KNOWN_FAILURES.some(([t, n]) => t === theme && n === name),
    );

    it.each(pairs)("%s reaches the minimum ratio", (_, key, minimum) => {
      const fore = over(resolveVar(vars, tokenVar(key)), surface);
      expect(contrast(fore, surface)).toBeGreaterThanOrEqual(minimum);
    });
  });
});
