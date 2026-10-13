import { readFileSync } from "fs";
import { resolve } from "path";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider/Provider";
import { SearchFilter } from "./SearchFilter";
import { tokens } from "./tokens";
import { SearchFilterItem } from "./types";

// Bounded input: three items, fixed labels, the en-US locale for "Reset".
const ITEMS: SearchFilterItem[] = [
  { id: "apple", label: "Apple" },
  { id: "banana", label: "Banana" },
  { id: "cherry", label: "Cherry" },
];

type HarnessProps = {
  initialSelected?: SearchFilterItem;
  items?: SearchFilterItem[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  showReset?: boolean;
  onItemSelect?: (item?: SearchFilterItem) => void;
  onReset?: () => void;
};

// SearchFilter is fully controlled: this stateful wrapper plays the caller,
// filtering `items` by the search and storing the selection.
const Harness = ({
  initialSelected,
  items = ITEMS,
  onItemSelect,
  ...props
}: HarnessProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(initialSelected);
  return (
    <SearchFilter
      {...props}
      label="Category"
      activeLabel={selected?.label}
      searchValue={search}
      onSearchChange={setSearch}
      placeholder="Search..."
      items={items.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase()),
      )}
      renderItem={(item) => (
        <div className="c__dropdown-menu-item">{item.label}</div>
      )}
      onItemSelect={(item) => {
        onItemSelect?.(item);
        setSelected(item);
      }}
      selected={selected}
    />
  );
};

const renderSearchFilter = (props: HarnessProps = {}) =>
  render(
    <CunninghamProvider currentLocale="en-US">
      <button type="button">Before</button>
      <Harness {...props} />
    </CunninghamProvider>,
  );

// Same normalisation as `filter/Filter.spec.tsx`: React ids, icon path data,
// the popover's computed position and React Aria's empty `<template>`.
const markup = () =>
  document.body.innerHTML
    .replace(/<template>(<div><\/div>)?<\/template>/g, "")
    .replace(/«r\w+»/g, "ID")
    .replace(/ d="[^"]*"/g, ' d="…"')
    .replace(/ style="position: absolute;[^"]*"/g, ' style="…"')
    .replace(/></g, ">\n<");

// The page behind the open popover is aria-hidden, hence `hidden: true`.
const trigger = () =>
  screen.getByRole("button", { name: /^Category/, hidden: true });
const input = () => screen.getByRole("textbox", { name: "Search..." });
const option = (name: string) => screen.getByRole("option", { name });
const resetRow = () => screen.queryByRole("button", { name: "Reset" });
const listbox = () => screen.queryByRole("listbox", { hidden: true });
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

// The input is focused one animation frame after the popover opens.
const open = async () => {
  const user = userEvent.setup();
  await user.click(trigger());
  await waitFor(() => expect(focused()).toBe(input()));
  return user;
};

const tabToTrigger = async () => {
  const user = userEvent.setup();
  screen.getByRole("button", { name: "Before" }).focus();
  await user.tab();
  expect(focused()).toBe(trigger());
  return user;
};

const button = (expanded: boolean, value?: string) =>
  `<button id="ID" class="c__filter__button${value ? " c__filter__button--active" : ""}" aria-expanded="${expanded}" aria-haspopup="listbox" type="button">
<span class="c__filter__label">${value ? `Category : ${value}` : "Category"}</span>
<span aria-hidden="true" class="material-icons c__filter__button__icon${expanded ? " opened" : ""}">keyboard_arrow_down</span>
</button>`;

const page = (
  trigger: string,
  hidden = false,
) => `<div${hidden ? ' aria-hidden="true"' : ""}>
<div class="c__app">
<button type="button">Before</button>
<div class="c__search-filter">
${trigger}
</div>
<div class="c__toast__container">
</div>
</div>
<div id="c__modals-portal-ID">
</div>
</div>`;

const DISMISS = `<div style="border: 0px; clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; width: 1px; white-space: nowrap;">
<button id="react-aria-ID" aria-label="Dismiss" tabindex="-1" style="width: 1px; height: 1px;">
</button>
</div>`;

const RESET = `<button type="button" class="c__dropdown-menu-item">
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
`;

const opened = (
  trigger: string,
  list: string,
  reset = "",
) => `${page(trigger, true)}
<span data-focus-scope-start="true" hidden="" aria-hidden="true">
</span>
<div data-testid="underlay" style="position: fixed; inset: 0;" aria-hidden="true">
</div>
<div style="display: contents;">
<div dir="ltr" style="…" class="c__dropdown-menu c__search-filter__popover" data-rac="" role="dialog" tabindex="-1" data-placement="bottom">
${DISMISS}
${reset}<div class="c__search-filter__search">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill="currentColor" fill-rule="evenodd" d="…" clip-rule="evenodd">
</path>
</svg>
<input placeholder="Search..." aria-label="Search..." type="text" value="">
</div>
<div class="c__separator c__separator--horizontal c__separator--thin">
</div>
<span data-focus-scope-start="true" hidden="">
</span>
${list}
<span data-focus-scope-end="true" hidden="">
</span>
${DISMISS}
</div>
</div>
<span data-focus-scope-end="true" hidden="" aria-hidden="true">
</span>`;

const LIST = `<div class="c__search-filter__list" data-rac="" aria-labelledby="ID" role="listbox" id="react-aria-ID" tabindex="0" data-collection="react-aria-ID"`;
const ITEM_ROWS = ITEMS.map(
  ({
    id,
    label,
  }) => `<div class="c__search-filter__item" data-rac="" role="option" tabindex="-1" data-collection="react-aria-ID" data-key="${id}" data-react-aria-pressable="true" id="react-aria-ID-option-${id}">
<div class="c__dropdown-menu-item">${label}</div>
</div>`,
).join("\n");

describe("SearchFilter states (AC1, AC3)", () => {
  it("default: the label alone, not active", () => {
    renderSearchFilter();
    expect(markup()).toBe(page(button(false)));
  });

  it("active: `label : activeLabel` and the active modifier", () => {
    renderSearchFilter({ initialSelected: ITEMS[1] });
    expect(markup()).toBe(page(button(false, "Banana")));
  });

  it("open: reset row, search input, then the items", async () => {
    renderSearchFilter({ initialSelected: ITEMS[1] });
    await open();
    expect(markup()).toBe(
      opened(
        button(true, "Banana"),
        `${LIST} data-layout="stack" data-orientation="vertical">
${ITEM_ROWS}
</div>`,
        RESET,
      ),
    );
  });

  it("loading: a spinner row replaces the items", async () => {
    renderSearchFilter({ isLoading: true });
    await open();
    expect(markup()).toBe(
      opened(
        button(true),
        `${LIST} data-layout="stack" data-orientation="vertical">
<div class="c__search-filter__loading" data-rac="" role="option" tabindex="-1" data-collection="react-aria-ID" data-key="__loading" data-react-aria-pressable="true" id="react-aria-ID-option-__loading">
<div class="c__spinner sm">
</div>
</div>
</div>`,
      ),
    );
  });

  it("loading wins over empty: no empty row while loading", async () => {
    renderSearchFilter({
      items: [],
      emptyState: "No results",
      isLoading: true,
    });
    await open();
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.queryByText("No results")).toBeNull();
  });

  it("empty with `emptyState`: the empty row alone", async () => {
    renderSearchFilter({ items: [], emptyState: "No results" });
    await open();
    expect(markup()).toBe(
      opened(
        button(true),
        `${LIST} data-layout="stack" data-orientation="vertical">
<div class="c__search-filter__empty" data-rac="" role="option" tabindex="-1" data-collection="react-aria-ID" data-key="__empty" data-react-aria-pressable="true" id="react-aria-ID-option-__empty">No results</div>
</div>`,
      ),
    );
  });

  // Current behaviour, pinned as is (not a recommendation): without
  // `emptyState`, empty items render an empty list with no message at all.
  it("empty without `emptyState`: silent, no row", async () => {
    renderSearchFilter({ items: [] });
    await open();
    expect(markup()).toBe(
      opened(
        button(true),
        `${LIST} data-empty="true" data-layout="stack" data-orientation="vertical">
</div>`,
      ),
    );
  });
});

describe("SearchFilter selection kept while searching (AC3)", () => {
  it("typing until the selected item is filtered out keeps the selection", async () => {
    const onItemSelect = vi.fn();
    renderSearchFilter({ initialSelected: ITEMS[1], onItemSelect });
    const user = await open();
    await user.type(input(), "ch");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Cherry",
    ]);
    expect(trigger()).toHaveAccessibleName("Category : Banana");
    expect(resetRow()).toBeInTheDocument();
    expect(onItemSelect).not.toHaveBeenCalled();
  });
});

describe("SearchFilter reset (AC2)", () => {
  it.each([
    ["with onReset", vi.fn()],
    ["without onReset", undefined],
  ])("%s: reset calls onItemSelect(undefined) once", async (_, onReset) => {
    onReset?.mockClear();
    const onItemSelect = vi.fn();
    renderSearchFilter({ initialSelected: ITEMS[1], onItemSelect, onReset });
    const user = await open();
    const errors = watchErrors();
    await user.click(resetRow()!);
    expect(errors()).toEqual([]);
    expect(onItemSelect).toHaveBeenCalledTimes(1);
    expect(onItemSelect).toHaveBeenCalledWith(undefined);
    if (onReset) expect(onReset).toHaveBeenCalledTimes(1);
    expect(trigger()).toHaveAccessibleName("Category");
    expect(resetRow()).toBeNull();
  });

  it.each(["{Enter}", " "])(
    "%s on the reset row resets once and calls onReset once",
    async (key) => {
      const onItemSelect = vi.fn();
      const onReset = vi.fn();
      renderSearchFilter({ initialSelected: ITEMS[1], onItemSelect, onReset });
      const user = await open();
      await user.tab();
      await user.tab();
      expect(focused()).toBe(resetRow());
      await user.keyboard(key);
      expect(onItemSelect).toHaveBeenCalledTimes(1);
      expect(onItemSelect).toHaveBeenCalledWith(undefined);
      expect(onReset).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    ["showReset={false}", { initialSelected: ITEMS[1], showReset: false }],
    ["no selection", {}],
  ])("%s: no reset row", async (_, props) => {
    renderSearchFilter(props);
    await open();
    expect(resetRow()).toBeNull();
  });
});

describe("SearchFilter keyboard (AC4)", () => {
  it("Enter opens and focuses the input, ArrowDown reaches the first option, Enter selects", async () => {
    const onItemSelect = vi.fn();
    const onReset = vi.fn();
    renderSearchFilter({ onItemSelect, onReset });
    const user = await tabToTrigger();
    await user.keyboard("{Enter}");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(focused()).toBe(input()));
    await user.keyboard("{ArrowDown}");
    expect(focused()).toBe(option("Apple"));
    await user.keyboard("{Enter}");
    expect(onItemSelect).toHaveBeenCalledTimes(1);
    expect(onItemSelect).toHaveBeenCalledWith(ITEMS[0]);
    expect(onReset).not.toHaveBeenCalled();
    expect(listbox()).toBeNull();
    expect(trigger()).toHaveAccessibleName("Category : Apple");
    await waitFor(() => expect(focused()).toBe(trigger()));
  });

  // Observed: from the input the component's own handler closes and restores
  // focus one frame later; from the listbox React Aria's popover closes and
  // restores focus itself.
  it("Escape from the input closes and returns focus to the trigger", async () => {
    renderSearchFilter();
    const user = await open();
    await user.keyboard("{Escape}");
    expect(listbox()).toBeNull();
    await waitFor(() => expect(focused()).toBe(trigger()));
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("Escape from the listbox closes and returns focus to the trigger", async () => {
    renderSearchFilter();
    const user = await open();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(focused()).toBe(option("Banana"));
    await user.keyboard("{Escape}");
    expect(listbox()).toBeNull();
    await waitFor(() => expect(focused()).toBe(trigger()));
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  // Observed: the popover contains focus and hides the page, so the trigger
  // is out of the Tab cycle while open; Tab cycles input, first option, reset
  // row, input.
  it("Tab cycles input, list and reset row inside the open popover", async () => {
    renderSearchFilter({ initialSelected: ITEMS[1] });
    const user = await open();
    const visited: (Element | null)[] = [];
    for (let i = 0; i < 3; i++) {
      await user.tab();
      visited.push(focused());
    }
    expect(visited).toEqual([option("Apple"), resetRow(), input()]);
  });
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

describe("SearchFilter tokens (AC1)", () => {
  it("holds the values of the stylesheet it replaced", () => {
    expect(tokens(defaultTokenRefs)).toEqual({
      "popover-min-width": "240px",
      "popover-max-width": "320px",
      "search-height": "36px",
      "list-max-height": "240px",
      "item-min-height": "32px",
      "item-font-weight": "500",
      "message-padding": "8px",
      "user-row-gap": "16px",
    });
  });

  it.each(THEMES)("are emitted in the %s theme block", (selector) => {
    const block = themeBlock(selector);
    expect(block).toBeDefined();
    const missing = Object.keys(tokens(defaultTokenRefs)).filter(
      (key) => !block!.includes(`--c--components--search-filter--${key}:`),
    );
    expect(missing).toEqual([]);
  });
});

describe("SearchFilter stylesheet (AC1)", () => {
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

  it("reads every search-filter token", () => {
    const scss = stylesheet();
    const unused = Object.keys(tokens(defaultTokenRefs)).filter(
      (key) => !scss.includes(`var(--c--components--search-filter--${key})`),
    );
    expect(unused).toEqual([]);
  });
});
