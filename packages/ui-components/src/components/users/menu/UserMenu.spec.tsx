import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguagePicker } from ":/components/language";
import { CunninghamProvider } from ":/components/provider/Provider";
import { UserMenu, UserMenuProps } from ".";

const USER = { full_name: "John Doe", email: "john.doe@example.com" };
const TERMS = "https://example.com/terms";

// The exported provider (all five locales); `provider/index` only knows en-US
// and fr-FR. The popover renders in a portal, so the whole body is compared.
const renderMenu = (props: Partial<UserMenuProps> = {}) =>
  render(
    <CunninghamProvider>
      <button type="button">Before</button>
      <UserMenu
        user={USER}
        appSettingsCTA={() => {}}
        settingsCTA={() => {}}
        logout={() => {}}
        termOfServiceUrl={TERMS}
        withMobileView={false}
        {...props}
      />
    </CunninghamProvider>,
  );

// React ids (`«r1»`, `react-aria-«r2»`) are normalised; icon path data and
// the popover's computed position (React Aria's, jsdom has no layout) carry
// nothing of the component. Compared to a literal rather than an inline
// snapshot: the setup's second vitest copy leaves inline snapshots stateless.
const markup = () =>
  document.body.innerHTML
    .replace(/«r\w+»/g, "ID")
    .replace(/ d="[^"]*"/g, ' d="…"')
    .replace(/ style="position: absolute;[^"]*"/g, ' style="…"')
    .replace(/></g, ">\n<");

// The page behind the open popover is aria-hidden, hence `hidden: true`.
const trigger = () =>
  screen.getByRole("button", { name: /user menu/, hidden: true });
const dialog = () => screen.getByRole("dialog", { name: "User menu" });
const focused = () => document.activeElement as HTMLElement;
const focusedName = () =>
  focused().getAttribute("aria-label") ?? focused().textContent;

const openWithKeyboard = async (key = "{Enter}") => {
  const user = userEvent.setup();
  screen.getByRole("button", { name: "Before" }).focus();
  await user.tab();
  await user.keyboard(key);
  return user;
};

const CLOSED = `<div>
<div class="c__app">
<button type="button">Before</button>
<button class="c__button c__button--brand c__button--brand--tertiary c__button--medium user-menu__button" id="ID" aria-expanded="false" aria-haspopup="dialog" aria-label="Open user menu" title="Open user menu">
<div class="c__avatar small blue-2">
<div class="c__avatar__initials">JD</div>
</div>
</button>
<div class="c__toast__container">
</div>
</div>
<div id="c__modals-portal-ID">
</div>
</div>`;

const OPEN = `<div aria-hidden="true">
<div class="c__app">
<button type="button">Before</button>
<button class="c__button c__button--brand c__button--brand--tertiary c__button--medium user-menu__button" id="ID" aria-expanded="true" aria-haspopup="dialog" aria-label="Close user menu" title="Close user menu">
<div class="c__avatar small blue-2">
<div class="c__avatar__initials">JD</div>
</div>
</button>
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
<div dir="ltr" style="…" class="c__dropdown-menu user-menu__popover" data-rac="" data-placement="bottom">
<div style="border: 0px; clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; width: 1px; white-space: nowrap;">
<button id="react-aria-ID" aria-label="Dismiss" tabindex="-1" style="width: 1px; height: 1px;">
</button>
</div>
<section class="react-aria-Dialog" data-rac="" aria-label="User menu" role="dialog" tabindex="-1">
<div class="user-menu__content__body">
<div class="user-menu__content__body__user-info">
<div class="c__avatar medium blue-2">
<div class="c__avatar__initials">JD</div>
</div>
<div class="user-menu__content__identity">
<p class="user-menu__content__identity__name">
<strong>John Doe</strong>
</p>
<p class="user-menu__content__identity__email">john.doe@example.com</p>
</div>
</div>
<div class="user-menu__content__body__settings">
<button type="button" class="user-menu__item">
<span class="user-menu__item__icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path fill="currentColor" fill-rule="evenodd" d="…" clip-rule="evenodd">
</path>
<path fill="currentColor" fill-rule="evenodd" d="…" clip-rule="evenodd">
</path>
</svg>
</span>
<span class="user-menu__item__label">App settings</span>
</button>
<button type="button" class="user-menu__item">
<span class="user-menu__item__icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path fill="currentColor" d="…">
</path>
<path fill="currentColor" fill-rule="evenodd" d="…" clip-rule="evenodd">
</path>
</svg>
</span>
<span class="user-menu__item__label">Manage account</span>
</button>
<button type="button" class="user-menu__item">
<span class="user-menu__item__icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path fill="currentColor" d="…">
</path>
<path fill="currentColor" d="…">
</path>
</svg>
</span>
<span class="user-menu__item__label">Logout</span>
</button>
</div>
<div class="user-menu__actions">
<div class="user-menu__actions__left">
<div class="c__dropdown-menu-trigger" id="ID">
<button class="c__button c__button--neutral c__button--neutral--tertiary c__button--nano c__language-picker c__button--with-icon--right" aria-label="Language: EN">
<span class="c__language-picker__label">EN</span>
<span class="c__button__icon">
<span class="material-icons icon--filled">arrow_drop_down</span>
</span>
</button>
</div>
</div>
<div class="user-menu__actions__right">
<a class="c__button c__button--neutral c__button--neutral--tertiary c__button--nano " target="_blank" href="https://example.com/terms">Terms of Service</a>
</div>
</div>
</div>
</section>
<div style="border: 0px; clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; width: 1px; white-space: nowrap;">
<button id="react-aria-ID" aria-label="Dismiss" tabindex="-1" style="width: 1px; height: 1px;">
</button>
</div>
</div>
</div>
<span data-focus-scope-end="true" hidden="" aria-hidden="true">
</span>`;

describe("UserMenu states (AC1)", () => {
  it("closed: the trigger only", () => {
    renderMenu();
    expect(markup()).toBe(CLOSED);
  });

  it("open: the labelled dialog with identity, items, language slot and terms", async () => {
    renderMenu({
      actions: (
        <LanguagePicker
          languages={[{ label: "English", value: "en-US", shortLabel: "EN" }]}
          size="nano"
          compact
        />
      ),
    });
    await openWithKeyboard();
    expect(markup()).toBe(OPEN);
  });

  it.each([null, undefined])("without user (%s): renders nothing", (user) => {
    renderMenu({ user });
    expect(screen.queryByRole("button", { name: /user menu/ })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(markup()).toBe(`<div>
<div class="c__app">
<button type="button">Before</button>
<div class="c__toast__container">
</div>
</div>
<div id="c__modals-portal-ID">
</div>
</div>`);
  });

  it("without a full name, the e-mail is the only, strong, identity line", async () => {
    renderMenu({ user: { email: USER.email } });
    await openWithKeyboard();
    const email = within(dialog()).getByText(USER.email);
    expect(email.tagName).toBe("STRONG");
    expect(within(dialog()).getAllByText(/john/i)).toHaveLength(1);
  });

  it.each([
    [{ appSettingsCTA: () => {} }, ["App settings"]],
    [{ settingsCTA: () => {} }, ["Manage account"]],
    [{ logout: () => {} }, ["Logout"]],
    [{ settingsCTA: () => {}, logout: () => {} }, ["Manage account", "Logout"]],
  ])("renders only the items whose prop is set (%#)", async (props, names) => {
    renderMenu({
      appSettingsCTA: undefined,
      settingsCTA: undefined,
      logout: undefined,
      termOfServiceUrl: undefined,
      ...props,
    });
    await openWithKeyboard();
    expect(
      within(dialog())
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(names);
  });

  it("string CTAs open a new window without opener; function CTAs are called", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const logout = vi.fn();
    renderMenu({
      appSettingsCTA: "https://example.com/app",
      settingsCTA: "https://example.com/account",
      logout,
    });
    const user = await openWithKeyboard();
    await user.click(within(dialog()).getByRole("button", { name: "App settings" }));
    expect(open).toHaveBeenLastCalledWith(
      "https://example.com/app",
      "_blank",
      "noopener,noreferrer",
    );
    await user.click(
      within(dialog()).getByRole("button", { name: "Manage account" }),
    );
    expect(open).toHaveBeenLastCalledWith(
      "https://example.com/account",
      "_blank",
      "noopener,noreferrer",
    );
    await user.click(within(dialog()).getByRole("button", { name: "Logout" }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(2);
  });
});

afterEach(() => vi.restoreAllMocks());

const ITEMS = ["App settings", "Manage account", "Logout", "Terms of Service"];

describe("UserMenu keyboard (AC3)", () => {
  it("Tab reaches the trigger, Enter opens, focus enters the dialog", async () => {
    renderMenu();
    const user = userEvent.setup();
    screen.getByRole("button", { name: "Before" }).focus();
    await user.tab();
    expect(focused()).toBe(trigger());
    await user.keyboard("{Enter}");
    expect(focused()).toBe(dialog());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAccessibleName("Close user menu");
  });

  it("Space opens", async () => {
    renderMenu();
    await openWithKeyboard(" ");
    expect(focused()).toBe(dialog());
  });

  it("Tab walks the items in order, wraps, Shift+Tab goes back, Escape returns focus", async () => {
    renderMenu();
    const user = await openWithKeyboard();
    const visited: (string | null)[] = [];
    for (let i = 0; i < ITEMS.length + 1; i++) {
      await user.tab();
      expect(dialog()).toContainElement(focused());
      visited.push(focusedName());
    }
    expect(visited).toEqual([...ITEMS, ITEMS[0]]);
    await user.tab({ shift: true });
    expect(focusedName()).toBe("Terms of Service");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(focused()).toBe(trigger()));
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAccessibleName("Open user menu");
  });

  it("Enter on an item calls its callback", async () => {
    const logout = vi.fn();
    renderMenu({ logout });
    const user = await openWithKeyboard();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(focusedName()).toBe("Logout");
    await user.keyboard("{Enter}");
    expect(logout).toHaveBeenCalledTimes(1);
  });

  // removed by t03 if accepted
  describe("default withMobileView (the modal path jsdom takes at 1024 px)", () => {
    it("opens, traps Tab, Escape returns focus to the trigger", async () => {
      renderMenu({ withMobileView: undefined });
      const user = await openWithKeyboard();
      const modal = screen.getByRole("dialog");
      for (let i = 0; i < 8; i++) {
        await user.tab();
        expect(modal).toContainElement(focused());
      }
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(focused()).toBe(trigger());
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });
  });
});
