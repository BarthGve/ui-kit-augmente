---
validated: yes
---
# Plan — Story s02-fix-dropdown-menu

Branch: `feature/s02-fix-dropdown-menu` (framing) · tickets: `feature/s02-fix-dropdown-menu/<ticket-id>`
Research: `docs/research/s02-fix-dropdown-menu.md` — read it first; this plan does not repeat it.

## Target story
**As a** keyboard and screen-reader user **I want** the dropdown menu to be operable and to announce its items and selection **so that** I can use it in every application. Complexity 3. Long labels, focus indicator contrast and the trigger `aria-expanded` belong to s25.
Acceptance criteria (docs/stories.md):
- The open menu exposes `role="menu"` and is no longer wrapped in a `role="dialog"` (test on the rendered DOM).
- Items are reachable with the arrow keys, activated with Enter; Escape calls `onOpenChange(false)`; Tab leaves the menu (tests).
- A selected item (`selectedValues` or `isChecked`) exposes its checked state to assistive technology, and the decorative check icon is hidden from it.
- The accessible name of an item includes its `subText`.
- `onSelectValue`, `callback`, `keepOpen`, `onOpenChange` keep their behaviour; `ContextMenu`, `Filter`, `HelpMenu` and the Share dropdowns still pass.
- A Vitest spec for `DropdownMenu` covers these points (none exists today).

## Tickets (ordered)
### t01-dropdown-menu-spec
- **size:** M
- **estimate:** 1.5d
- **depends on:** none
- **scope:** the missing Vitest spec, written first; it fails on the points the story fixes and pins the behaviour that must not change.

Tasks:
1. [x] Create `packages/ui-components/src/components/dropdown-menu/DropdownMenu.spec.tsx` with Testing Library and `userEvent`, mounting `DropdownMenu` open (`isOpen`) with a trigger child and a mixed `options` list (plain, `isChecked`, `value` + `selectedValues`, `subText`, `keepOpen`, a separator, a disabled item).
2. [x] Characterisation tests that must pass before and after: `onSelectValue` receives `value`; `callback` is called; `onOpenChange(false)` is called after an action unless `keepOpen`; a hidden or disabled item is not activatable.
3. [x] Target tests that must fail now: no element with `role="dialog"` around the menu; the menu has `role="menu"`; Escape calls `onOpenChange(false)`; Tab moves focus out of the menu; a selected item exposes a checked state (assert the role, `menuitemradio` or `menuitemcheckbox`, and `aria-checked`, once t03 settles which); the check icon is `aria-hidden`; the name of an item with `subText` contains both texts.
4. [x] Run only this spec; record which tests are red. If jsdom cannot represent a point (focus trap on Tab), say so in the ticket and cover it with a Playwright component test next to `e2e/help-menu/` instead of dropping it.

t01 notes (spec run on the current code, 2026-10-09):
- Green today and kept as plain `it`: the characterisation tests (onSelectValue, callback, close after action, keepOpen, disabled, hidden, arrows + Enter), `role="menu"` named by the trigger, and Escape calling `onOpenChange(false)` — the last two were expected red by task 3 but already pass.
- Red today, marked `it.fails` with `// fixed by tNN`: not wrapped in a dialog (t02), Tab leaves the menu (t02), checked state as `menuitemradio`/`menuitemcheckbox` + `aria-checked` (t03), check icon `aria-hidden` (t03), item name contains `subText` (t03).
- jsdom does represent the Tab point: adding `isNonModal` to the root Popover turns both t02 tests green, so no Playwright test was added.

### t02-menu-role-and-keyboard
- **size:** S
- **estimate:** 1d
- **depends on:** t01-dropdown-menu-spec
- **scope:** remove the dialog wrapper and make the keyboard behaviour as specified.

Tasks:
1. [x] In `dropdown-menu/DropdownMenu.tsx`, test `isNonModal` on the root `<Popover>` (react-aria-components 1.16.0 renders a dialog unless `isNonModal`, `Popover.tsx:189-227`) so that the menu is no longer inside `role="dialog"`. Keep `triggerRef`, `isOpen`, `onOpenChange` and `shouldCloseOnInteractOutside` working.
2. [x] Check click-outside still closes the menu, since `isNonModal` removes the underlay and the dismiss button: add a test for it in the spec.
3. [x] Escape and Tab: the t01 tests pass. If Tab cannot be made to leave the menu while the caller owns `isOpen`, document the exact limit in the spec and in the ticket instead of hiding it.
4. [x] Run the e2e specs that open this menu (`e2e/help-menu`, `e2e/context-menu`, `e2e/filter`, `e2e/share-modal`) when Playwright can run; otherwise state they were not run.

t02 notes (2026-10-09):
- `isNonModal` alone removes the dialog and lets Tab leave, but it also turns off React Aria's outside-click dismissal: a click on a non-focusable area no longer closed the menu (test red). Restored in `DropdownMenu.tsx` with `useInteractOutside` from `react-aria` (already a dependency), through one predicate also passed to the Popover: the trigger is excluded (all nine consumers toggle `isOpen` from it, otherwise the click closes then reopens), portaled submenu popovers (`data-trigger="SubmenuTrigger"`) are excluded, then the caller's `shouldCloseOnInteractOutside` decides.
- Tab limit (documented in the spec): Tab moves focus out of the menu, but the menu is not asked to close. The popover is portaled at the end of `body`, so focus goes past the page (jsdom: `body`; real browser not exercised, no e2e presses Tab out of the menu), React Aria's blur handler sees no `relatedTarget` and keeps it open. The menu stays visible until an outside click (or a focus move onto another page element, which does close it).
- The "click on the trigger closes" test was red on `next` in jsdom (the old code closed then the toggle reopened); it is a new guarantee, not a characterisation. Real-browser behaviour before the change (underlay) was not checked.
- Spec: the two t02 tests flipped to `it`; added outside click (on `document.body`), refusal by `shouldCloseOnInteractOutside`, click on the trigger, submenu item activation. `it` is now imported from `vitest`: the global type has no `.fails`, which broke `yarn build` (inherited from t01).
- e2e (chromium only, headless shell 1243 via a throwaway config, port from dm-port): 107/111 pass; the 4 failures are the HelpMenu "opens … in a new tab" tests (`newPage.url()` empty), which fail identically with the `next` version of the component. WebKit and Firefox were not run.

### t03-selected-state-and-names
- **size:** M
- **estimate:** 1.5d
- **depends on:** t02-menu-role-and-keyboard
- **scope:** announce the selected state and keep full accessible names.

Tasks:
1. [ ] Choose how the selected state is exposed and let the t01 tests decide: either `selectionMode` with `selectedKeys` on the React Aria `Menu`, or `aria-checked` on `menuitemradio`/`menuitemcheckbox` items set explicitly. Record the choice in `docs/decisions/003-dropdown-menu-selection-semantics.md` (ADR, with the rejected option) because it changes the interaction model of a shared component.
2. [ ] Keep `onAction` → `onSelectValue`, `callback`, `keepOpen` unchanged for every consumer; if `selectionMode` is chosen, map `onSelectionChange` back to the same three calls.
3. [ ] In `menu/MenuItemBody.tsx`, hide the check and chevron icons from assistive technology (`aria-hidden`), without changing the class `c__dropdown-menu-item__check` that `e2e/context-menu/context-menu-checked.spec.tsx` queries.
4. [ ] In `DropdownMenu.tsx`, make the item name include `subText`: stop overriding the content with `aria-label={getAriaLabel(option)}` where it hides `subText`, but keep the `opensInNewWindow` suffix (`components.menu.newWindowLabelSuffix`). Update the e2e queries `getByRole("menuitem", { name })` only where the name legitimately changed.
5. [ ] The t01 target tests are green and the characterisation tests still pass.

### t04-consumers-regression-and-delivery
- **size:** S
- **estimate:** 1d
- **depends on:** t03-selected-state-and-names
- **scope:** prove the nine consumers still work, then deliver.

Tasks:
1. [ ] Run the existing stories and tests of the consumers: `ContextMenu`, `Filter`, `HelpMenu`, `FeedbackForm`, `language-picker`, `FilePreview`, and the Share dropdowns (`AccessRoleDropdown`, `ShareMembersActions`, `ShareLinkSettings`, `ShareMemberItem`, `ShareInvitationItem`). Fix only what the change broke.
2. [ ] Open the `DropdownMenu` stories in Storybook, use the keyboard and the a11y panel in light and dark: no new violation. Stop the server afterwards.
3. [ ] Add a changeset in `.changeset/` (`@gouvfr-lasuite/ui-components`, patch or minor as the selection change decides).
4. [ ] Update the design-system artifact (`DropdownMenu` page: roles and selection note); the PR description carries `Artifact: updated (version <id>)`.
5. [ ] Run `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`.

## US totals
- **Person-days:** 5
- **Size mix:** 2×M, 2×S

## Run interdicts
- Do not change the public props or types of `DropdownMenu`, `DropdownMenuItem`, `MenuItemAction`.
- `onSelectValue`, `callback`, `keepOpen` and `onOpenChange` keep their current behaviour for every consumer.
- Do not touch the label width, wrapping, the `tiny` variant, the focus background colour or the trigger markup: those belong to s25.
- Keep the class names `c__dropdown-menu-item__check` and `c__dropdown-menu-item`.
- No new dependency; no literal colour; no new locale key unless a visible text is added (then all five locales).

## The point everything turns on
How the selected state is exposed (React Aria `selectionMode` versus explicit `aria-checked`): it decides the roles, the events and whether any consumer notices. t01 pins today's callbacks so the choice can be made on evidence and recorded in ADR 003.

## Files touched
- t01: `components/dropdown-menu/DropdownMenu.spec.tsx` (new).
- t02: `components/dropdown-menu/DropdownMenu.tsx`.
- t03: `components/dropdown-menu/DropdownMenu.tsx`, `components/menu/MenuItemBody.tsx`, `docs/decisions/003-dropdown-menu-selection-semantics.md` (new), affected `e2e/**` queries.
- t04: `.changeset/<name>.md` (new), the artifact (outside the repo), fixes in consumers only if broken.

## Test strategy
- Unit (Vitest + Testing Library): roles, keyboard, selection state, accessible names, callbacks; written first (t01).
- Component (Playwright): the existing e2e specs of help-menu, context-menu, filter and share; add one only for what jsdom cannot show (Tab focus).
- Manual: Storybook keyboard and a11y panel.
- Prerequisite: dependencies must install (corrupted Yarn cache); `yarn cache clean` before `/dm-execute`.

## Definition of Done
Single PR into `next` per ticket, structured description with `Artifact: updated (version <id>)`, readable diff, `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build` pass, review passed (no open critical or major), merged to `next`.
