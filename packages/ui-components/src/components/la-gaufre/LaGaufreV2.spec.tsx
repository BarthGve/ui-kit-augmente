/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider/Provider";
import { Locales } from ":/components/provider/Locales";
import { locales } from ":/locales/Locale";
import { LaGaufreV2, LaGaufreV2Props } from "./LaGaufreV2";

const DEFAULT_WIDGET = "https://static.suite.anct.gouv.fr/widgets/lagaufre.js";
const DATA = { services: [] };

// No network: jsdom never runs `<script src>` and `fetch` is mocked by the
// shared setup. The remote widget is replaced by what it reads: the init
// entries queued on `window._lasuite_widget`.
const queue = () => (window as any)._lasuite_widget as any[];
const lastInit = () => {
  const entry = queue()[queue().length - 1];
  expect(entry.slice(0, 2)).toEqual(["lagaufre", "init"]);
  return entry[2];
};

const renderGaufre = (
  props: Partial<LaGaufreV2Props> = { data: DATA },
  currentLocale: string = Locales.enUS,
) =>
  render(
    <CunninghamProvider currentLocale={currentLocale}>
      <LaGaufreV2 {...(props as LaGaufreV2Props)} />
    </CunninghamProvider>,
  );

const waffle = () => screen.getByRole("button");

beforeEach(() => {
  (window as any)._lasuite_widget = [];
  document
    .querySelectorAll("#lasuite-widget-lagaufre-shadow")
    .forEach((node) => node.remove());
  fetchMock.mockClear();
});

describe.each(Object.values(Locales))("LaGaufreV2 label in %s (AC2)", (locale) => {
  const strings = locales[locale].components.laGaufre;

  it("labels the button and the widget in the locale", () => {
    renderGaufre({ data: DATA }, locale);
    expect(strings.label).not.toBe("");
    expect(waffle()).toHaveAccessibleName(strings.label);
    if (locale !== Locales.enUS) {
      expect(strings.label).not.toBe(locales[Locales.enUS].components.laGaufre.label);
    }
    expect(lastInit()).toMatchObject({
      label: strings.label,
      closeLabel: strings.closeLabel,
      headerLabel: strings.headerLabel,
      loadingText: strings.loadingText,
      viewMoreLabel: strings.viewMoreLabel,
      viewLessLabel: strings.viewLessLabel,
      newWindowLabelSuffix: strings.newWindowLabelSuffix,
    });
  });
});

describe("LaGaufreV2 locales (AC2)", () => {
  it("a caller label wins over the translation", () => {
    renderGaufre({ data: DATA, label: "Mine" }, Locales.frFR);
    expect(waffle()).toHaveAccessibleName("Mine");
    expect(lastInit().label).toBe("Mine");
  });

  it("the five locales share the laGaufre and userMenu keys", () => {
    const keys = (locale: Locales, ns: "laGaufre" | "userMenu") =>
      Object.keys(locales[locale].components[ns]).sort();
    for (const locale of Object.values(Locales)) {
      expect(keys(locale, "laGaufre")).toEqual(keys(Locales.enUS, "laGaufre"));
      expect(keys(locale, "userMenu")).toEqual(keys(Locales.enUS, "userMenu"));
    }
  });
});

// The icon path data is normalised (nine copies of one dot), React ids too.
const markup = (container: HTMLElement) =>
  container.innerHTML
    .replace(/«r\w+»/g, "ID")
    .replace(/ d="[^"]*"/g, ' d="…"')
    .replace(/></g, ">\n<");

const CLOSED = `<div class="c__app">
<div>
<button class="c__button c__button--brand c__button--brand--tertiary c__button--medium lagaufre-button c__button--icon-only" aria-label="Digital LaSuite services">
<span class="c__button__icon">
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18" aria-hidden="true">
<defs>
<path id="a" fill="currentColor" d="…">
</path>
</defs>
<use href="#a">
</use>
<use href="#a" transform="translate(6.5)">
</use>
<use href="#a" transform="translate(13)">
</use>
<use href="#a" transform="translate(0 6.5)">
</use>
<use href="#a" transform="translate(6.5 6.5)">
</use>
<use href="#a" transform="translate(13 6.5)">
</use>
<use href="#a" transform="translate(0 13)">
</use>
<use href="#a" transform="translate(6.5 13)">
</use>
<use href="#a" transform="translate(13 13)">
</use>
</svg>
</span>
</button>
</div>
<div class="c__toast__container">
</div>
</div>
<div id="c__modals-portal-ID">
</div>`;

// React 19 hoists the async script into <head> and dedupes it by `src`, so it
// is not part of the container; hoisted nodes outlive RTL's cleanup.
const scripts = (src: string) =>
  [...document.head.querySelectorAll("script")].filter(
    (script) => script.getAttribute("src") === src,
  );

const CONTRACT_KEYS = [
  "api",
  "background",
  "buttonElement",
  "closeLabel",
  "data",
  "headerLabel",
  "headerLogo",
  "label",
  "loadingText",
  "newWindowLabelSuffix",
  "position",
  "showFooter",
  "viewLessLabel",
  "viewMoreLabel",
];

const placeButton = (rect: Partial<DOMRect>) =>
  vi.spyOn(waffle(), "getBoundingClientRect").mockReturnValue(rect as DOMRect);

describe("LaGaufreV2 closed state and widget contract (AC1, AC3)", () => {
  it("closed: the icon-only button, then the widget script, no request", () => {
    const { container } = renderGaufre();
    expect(markup(container)).toBe(CLOSED);
    const [script] = scripts(DEFAULT_WIDGET);
    expect(script).toHaveAttribute("id", "lasuite-gaufre-script");
    expect(script).toHaveAttribute("async");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("widgetPath changes the script source", () => {
    renderGaufre({ data: DATA, widgetPath: "https://example.com/own.js" });
    expect(scripts("https://example.com/own.js")).toHaveLength(1);
  });

  it("hands the widget the very button: Enter and Space reach its listener", async () => {
    renderGaufre();
    // What the widget does on load: read the queued init, listen on the button.
    const onOpen = vi.fn();
    const config = lastInit();
    expect(config.buttonElement).toBe(waffle());
    config.buttonElement.addEventListener("click", onOpen);

    const user = userEvent.setup();
    await user.tab();
    expect(waffle()).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledTimes(1);
    await user.keyboard(" ");
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("with only data, the init payload carries exactly these keys", () => {
    renderGaufre();
    const config = lastInit();
    expect(Object.keys(config).sort()).toEqual(CONTRACT_KEYS);
    expect(config.headerLogo).toEqual(expect.any(String));
    expect(config.headerLogo).not.toBe("");
    expect(config.showFooter).toBe(false);
    expect(config.position).toEqual(expect.any(Function));
  });

  it("passes the remaining props through to the widget", () => {
    renderGaufre({
      data: DATA,
      fontFamily: "Marianne",
      showMoreLimit: 3,
      headerUrl: "https://example.com/about",
    });
    expect(lastInit()).toMatchObject({
      fontFamily: "Marianne",
      showMoreLimit: 3,
      headerUrl: "https://example.com/about",
    });
  });

  it("apiUrl xor data: services in data drop the api", () => {
    renderGaufre({ apiUrl: "https://example.com/api" });
    expect(lastInit()).toMatchObject({
      api: "https://example.com/api",
      data: undefined,
    });

    renderGaufre({ data: DATA });
    expect(lastInit().api).toBeUndefined();

    renderGaufre({ apiUrl: "https://example.com/api", data: DATA } as any);
    expect(lastInit()).toMatchObject({ api: undefined, data: DATA });
  });

  it("position(): below a button in the top half, right-aligned when it fits", () => {
    renderGaufre();
    placeButton({ top: 10, bottom: 50, left: 900, right: 940 });
    expect(lastInit().position()).toEqual({
      position: "fixed",
      top: 60,
      right: window.innerWidth - 940,
    });
  });

  it("position(): above a button in the lower half, left-aligned when it does not fit", () => {
    renderGaufre();
    placeButton({ top: 700, bottom: 740, left: 10, right: 50 });
    expect(lastInit().position()).toEqual({
      position: "fixed",
      bottom: window.innerHeight - 700 + 10,
      left: 10,
    });
  });

  // Current behaviour, documented (research traps): unmounting cleans
  // nothing up. A later cleanup fails this test on purpose and must update it.
  it("unmount leaves the queued init and the widget's shadow host in place", () => {
    const { unmount } = renderGaufre();
    const config = lastInit();
    const host = document.createElement("div");
    host.id = "lasuite-widget-lagaufre-shadow";
    document.body.appendChild(host);

    unmount();
    expect(queue()).toHaveLength(1);
    expect(document.body).toContainElement(host);
    expect(config.position()).toEqual({
      position: "absolute",
      top: 10,
      right: 10,
    });

    // The next mount removes the stale host before queuing its own init.
    renderGaufre();
    expect(host.isConnected).toBe(false);
    expect(queue()).toHaveLength(2);
  });
});
