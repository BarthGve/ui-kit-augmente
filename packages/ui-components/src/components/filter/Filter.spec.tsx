import { readFileSync } from "fs";
import { resolve } from "path";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider/Provider";
import { Filter, FilterProps } from "./Filter";
import { tokens } from "./tokens";

// Bounded input: three options, fixed labels, the en-US locale for "Reset".
const OPTIONS = [
  { label: "All", value: "all" },
  { label: "File", value: "file" },
  { label: "Folder", value: "folder" },
];

const renderFilter = (props: Partial<FilterProps> = {}) =>
  render(
    <CunninghamProvider currentLocale="en-US">
      <button type="button">Before</button>
      <Filter label="Type" options={OPTIONS} {...props} />
    </CunninghamProvider>,
  );

// React ids (`«r1»`, `react-aria-«r2»`) are normalised; icon path data, the
// popover's computed position (React Aria's, jsdom has no layout) and React
// Aria's empty collection `<template>` carry nothing of the component. The
// popover renders in a portal, so the whole body is compared. Compared to a
// literal rather than an inline snapshot: the setup's second vitest copy
// leaves inline snapshots stateless.
const markup = () =>
  document.body.innerHTML
    .replace(/<template>(<div><\/div>)?<\/template>/g, "")
    .replace(/«r\w+»/g, "ID")
    .replace(/ d="[^"]*"/g, ' d="…"')
    .replace(/ style="position: absolute;[^"]*"/g, ' style="…"')
    .replace(/></g, ">\n<");

// The page behind the open popover is aria-hidden, hence `hidden: true`.
const trigger = () =>
  screen.getByRole("button", { name: /^Type/, hidden: true });
const option = (name: string) => screen.getByRole("option", { name });
const resetRow = () => screen.queryByRole("button", { name: "Reset" });
const focused = () => document.activeElement;

// Errors thrown by an event handler are reported on `window`, not to the
// test: collect them so a reset that throws (e.g. a missing callback) is red.
const watchErrors = () => {
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => {
    event.preventDefault();
    errors.push(event.error);
  };
  window.addEventListener("error", onError);
  return () => {
    window.removeEventListener("error", onError);
    return errors;
  };
};

const tabToTrigger = async () => {
  const user = userEvent.setup();
  screen.getByRole("button", { name: "Before" }).focus();
  await user.tab();
  expect(focused()).toBe(trigger());
  return user;
};

const HIDDEN_SELECT = `<div style="border: 0px; clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: fixed; width: 1px; white-space: nowrap; top: 0px; left: 0px;" aria-hidden="true" data-react-aria-prevent-focus="true" data-a11y-ignore="aria-hidden-focus" data-testid="hidden-select-container">
<label>
<select tabindex="-1" title="">
<option>
</option>
<option value="all">All</option>
<option value="file">File</option>
<option value="folder">Folder</option>
</select>
</label>
</div>`;

const closed = (button: string) => `<div>
<div class="c__app">
<button type="button">Before</button>
<div class="c__filter" data-rac="">
${button}
${HIDDEN_SELECT}
</div>
<div class="c__toast__container">
</div>
</div>
<div id="c__modals-portal-ID">
</div>
</div>`;

const DEFAULT =
  closed(`<button id="react-aria-ID" class="c__filter__button" data-rac="" type="button" tabindex="0" data-react-aria-pressable="true" aria-labelledby="react-aria-ID react-aria-ID" aria-haspopup="listbox" aria-expanded="false">
<span class="c__filter__label" id="react-aria-ID">Type</span>
<span aria-hidden="true" class="material-icons c__filter__button__icon">keyboard_arrow_down</span>
</button>`);

const ACTIVE =
  closed(`<button id="react-aria-ID" class="c__filter__button c__filter__button--active" data-rac="" type="button" tabindex="0" data-react-aria-pressable="true" aria-labelledby="react-aria-ID react-aria-ID" aria-haspopup="listbox" aria-expanded="false">
<span class="c__filter__label" id="react-aria-ID">Type : File</span>
<span aria-hidden="true" class="material-icons c__filter__button__icon">keyboard_arrow_down</span>
</button>`);

// Open with a value: the reset row precedes the list, the chevron carries
// `opened`, the selected row is focused and alone to show the checkmark.
const OPEN = `<div aria-hidden="true">
<div class="c__app">
<button type="button">Before</button>
<div class="c__filter" data-rac="" data-open="true">
<button id="react-aria-ID" class="c__filter__button c__filter__button--active" data-rac="" type="button" tabindex="0" data-react-aria-pressable="true" aria-labelledby="react-aria-ID react-aria-ID" aria-haspopup="listbox" aria-expanded="true" aria-controls="react-aria-ID" data-pressed="true">
<span class="c__filter__label" id="react-aria-ID">Type : File</span>
<span aria-hidden="true" class="material-icons c__filter__button__icon opened">keyboard_arrow_down</span>
</button>
${HIDDEN_SELECT}
</div>
<div class="c__toast__container">
</div>
</div>
<div id="c__modals-portal-ID">
</div>
</div>
<span data-focus-scope-start="true" hidden="" aria-hidden="true">
</span>
<div data-testid="underlay" style="position: fixed; inset: 0;" aria-hidden="true">
</div>
<div style="display: contents;">
<div dir="ltr" style="…" class="c__dropdown-menu" data-rac="" aria-labelledby="react-aria-ID" data-trigger="Select" role="dialog" tabindex="-1" data-placement="bottom">
<div style="border: 0px; clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; width: 1px; white-space: nowrap;">
<button id="react-aria-ID" aria-label="Dismiss" tabindex="-1" style="width: 1px; height: 1px;">
</button>
</div>
<button type="button" class="c__dropdown-menu-item">
<div class="c__dropdown-menu-item__icon" aria-hidden="true">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill="currentColor" d="…">
</path>
</svg>
</div>
<div class="c__dropdown-menu-item__label-container">
<div class="c__dropdown-menu-item__label">Reset</div>
</div>
</button>
<div class="c__separator c__separator--horizontal c__separator--thin">
</div>
<div>
<span data-focus-scope-start="true" hidden="">
</span>
<div id="react-aria-ID" class="react-aria-ListBox" data-rac="" aria-labelledby="react-aria-ID" role="listbox" tabindex="-1" data-collection="react-aria-ID" data-layout="stack" data-orientation="vertical">
<div data-has-submenu="false" class="c__dropdown-menu-item" data-rac="" role="option" aria-selected="false" tabindex="-1" data-collection="react-aria-ID" data-key="all" data-react-aria-pressable="true" id="react-aria-ID-option-all" data-selection-mode="single">
<div class="c__dropdown-menu-item__label-container">
<div class="c__dropdown-menu-item__label">All</div>
</div>
</div>
<div data-has-submenu="false" class="c__dropdown-menu-item" data-rac="" role="option" aria-selected="true" tabindex="0" data-collection="react-aria-ID" data-key="file" data-react-aria-pressable="true" id="react-aria-ID-option-file" data-selected="true" data-selection-mode="single" data-focused="true" data-focus-visible="true">
<div class="c__dropdown-menu-item__label-container">
<div class="c__dropdown-menu-item__label">File</div>
</div>
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="c__dropdown-menu-item__check" aria-hidden="true">
<path fill="currentColor" d="…">
</path>
</svg>
</div>
<div data-has-submenu="false" class="c__dropdown-menu-item" data-rac="" role="option" aria-selected="false" tabindex="-1" data-collection="react-aria-ID" data-key="folder" data-react-aria-pressable="true" id="react-aria-ID-option-folder" data-selection-mode="single">
<div class="c__dropdown-menu-item__label-container">
<div class="c__dropdown-menu-item__label">Folder</div>
</div>
</div>
</div>
<span data-focus-scope-end="true" hidden="">
</span>
</div>
<div style="border: 0px; clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; width: 1px; white-space: nowrap;">
<button id="react-aria-ID" aria-label="Dismiss" tabindex="-1" style="width: 1px; height: 1px;">
</button>
</div>
</div>
</div>
<span data-focus-scope-end="true" hidden="" aria-hidden="true">
</span>`;

describe("Filter states (AC1)", () => {
  it("default: the label alone, not active", () => {
    renderFilter();
    expect(markup()).toBe(DEFAULT);
  });

  it("active: `label : option` and the active modifier", () => {
    renderFilter({ defaultSelectedKey: "file" });
    expect(markup()).toBe(ACTIVE);
  });

  it("open: expanded trigger, reset row, checkmark on the selected row only", () => {
    // `onReset` is passed to prove it never reaches the DOM.
    renderFilter({
      defaultSelectedKey: "file",
      defaultOpen: true,
      onReset: () => {},
    });
    expect(markup()).toBe(OPEN);
  });
});

describe("Filter selection and reset (AC2)", () => {
  it("selecting an option marks the trigger active and reports the key", async () => {
    const onSelectionChange = vi.fn();
    const onReset = vi.fn();
    renderFilter({ onSelectionChange, onReset });
    const user = userEvent.setup();
    await user.click(trigger());
    await user.click(option("Folder"));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith("folder");
    expect(trigger()).toHaveAccessibleName("Type : Folder");
    expect(onReset).not.toHaveBeenCalled();
  });

  it.each([
    ["with onReset", vi.fn()],
    ["without onReset", undefined],
  ])(
    "%s: reset clears the value once, keeps the popover open, drops the active state",
    async (_, onReset) => {
      onReset?.mockClear();
      const onSelectionChange = vi.fn();
      renderFilter({ defaultSelectedKey: "file", onSelectionChange, onReset });
      const user = userEvent.setup();
      await user.click(trigger());
      const errors = watchErrors();
      await user.click(resetRow()!);
      expect(errors()).toEqual([]);
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith(null);
      if (onReset) expect(onReset).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(trigger()).toHaveAccessibleName("Type");
      // The row only exists while a value is selected.
      expect(resetRow()).toBeNull();
    },
  );

  it.each([
    ["showReset={false}", { defaultSelectedKey: "file", showReset: false }],
    ["no value", {}],
  ])("%s: no reset row", (_, props) => {
    renderFilter({ ...props, defaultOpen: true });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(resetRow()).toBeNull();
  });
});

describe("Filter keyboard (AC4)", () => {
  it.each(["{Enter}", " ", "{ArrowDown}"])(
    "%s on the trigger opens the list on the first option",
    async (key) => {
      renderFilter();
      const user = await tabToTrigger();
      await user.keyboard(key);
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(focused()).toBe(option("All"));
    },
  );

  it("arrows move, Enter selects, closes and returns focus to the trigger", async () => {
    const onSelectionChange = vi.fn();
    renderFilter({ onSelectionChange });
    const user = await tabToTrigger();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    expect(focused()).toBe(option("File"));
    await user.keyboard("{Enter}");
    expect(onSelectionChange).toHaveBeenCalledWith("file");
    expect(screen.queryByRole("listbox", { hidden: true })).toBeNull();
    expect(trigger()).toHaveAccessibleName("Type : File");
    await waitFor(() => expect(focused()).toBe(trigger()));
  });

  it("Escape closes without selecting and returns focus to the trigger", async () => {
    const onSelectionChange = vi.fn();
    renderFilter({ onSelectionChange });
    const user = await tabToTrigger();
    await user.keyboard("{Enter}");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox", { hidden: true })).toBeNull();
    expect(onSelectionChange).not.toHaveBeenCalled();
    await waitFor(() => expect(focused()).toBe(trigger()));
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it.each(["{Enter}", " "])(
    "Tab reaches the reset row from the list, %s activates it",
    async (key) => {
      const onSelectionChange = vi.fn();
      const onReset = vi.fn();
      renderFilter({ defaultSelectedKey: "file", onSelectionChange, onReset });
      const user = await tabToTrigger();
      await user.keyboard("{Enter}");
      expect(focused()).toBe(option("File"));
      await user.tab();
      expect(focused()).toBe(resetRow());
      await user.keyboard(key);
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith(null);
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(trigger()).toHaveAccessibleName("Type");
    },
  );
});

// --- Tokens (s07 t03) --------------------------------------------------------
// Vitest stubs stylesheets, so the sources are read from disk.
const read = (path: string) => readFileSync(resolve(__dirname, path), "utf8");

// Theme blocks of the shipped `cunningham-tokens.css`: flat declarations only,
// the first `}` closes the block.
const THEMES = [
  ":root ",
  ".cunningham-theme--dark",
  ".cunningham-theme--dsfr-light",
  ".cunningham-theme--dsfr-dark",
  ".cunningham-theme--anct-light",
  ".cunningham-theme--anct-dark",
];
const themeBlock = (selector: string) =>
  read("../../cunningham-tokens.css").split(`${selector}{`)[1]?.split("}")[0];

// Comments stripped (they may quote a literal), whitespace collapsed.
const stylesheet = () =>
  read("index.scss")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, " ");

describe("Filter tokens (AC1)", () => {
  it("holds the values of the stylesheet it replaced", () => {
    expect(tokens(defaultTokenRefs)).toEqual({
      "button-height": "32px",
      "button-radius": "4px",
      "button-border-width": "1px",
      "button-font-size": "14px",
      "button-font-weight": "400",
      "button-active-font-weight": "500",
      "button-gap": "6px",
      "button-padding": "0 6px 0 8px",
      "icon-size": "1.25rem",
      "item-gap": "6px",
      "popover-border-width": "1px",
      "popover-radius": "4px",
      "popover-padding": "8px",
    });
  });

  it.each(THEMES)("are emitted in the %s theme block", (selector) => {
    const block = themeBlock(selector);
    expect(block).toBeDefined();
    const missing = Object.keys(tokens(defaultTokenRefs)).filter(
      (key) => !block!.includes(`--c--components--filter--${key}:`),
    );
    expect(missing).toEqual([]);
  });
});

describe("Filter stylesheet (AC1)", () => {
  it("holds no literal size, weight or colour, and no var() fallback", () => {
    const scss = stylesheet();
    expect(scss).not.toMatch(/var\(\s*--[\w-]+\s*,/);
    // Custom property names may contain digits or `px`: drop them first.
    const values = scss.replace(/--[\w-]+/g, "--");
    expect(values).not.toMatch(/\d(px|r?em)\b/);
    expect(values).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(values).not.toMatch(/\brgba?\(/);
    expect(values).not.toMatch(/font-weight:\s*\d/);
  });

  it("reads every filter token", () => {
    const scss = stylesheet();
    const unused = Object.keys(tokens(defaultTokenRefs)).filter(
      (key) => !scss.includes(`var(--c--components--filter--${key})`),
    );
    expect(unused).toEqual([]);
  });
});
