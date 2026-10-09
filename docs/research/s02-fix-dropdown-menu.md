# Research — Story s02-fix-dropdown-menu

Worktree `.worktrees/s02-fix-dropdown-menu`, branch `feature/s02-fix-dropdown-menu` (from `next` at `1cda87fb`). Nothing was run: dependencies are not installed (Yarn cache corruption). Claims come from reading the source, from the published `react-aria-components` 1.16.0 package (downloaded to a scratch folder, read only), and from contrast computed on the generated token file.

## The five structuring facts
1. **The story bundles six distinct defects from ui-kit #183, and only some are in the component.** `DropdownMenu` does not own its trigger: it wraps `children` in a `div` (`DropdownMenu.tsx:140-150`) and the open state is controlled by the caller through `isOpen` (default `false`) and `onOpenChange`. The upstream complaint "trigger missing `aria-expanded`" is therefore a **caller-side** fix in 8 consumer files, not something the component can add alone.
2. **The popover is a `role="dialog"` today.** `react-aria-components` 1.16.0 renders a Popover as a dialog unless `isNonModal` is set (`Popover.tsx:189-191`, `:227`), and `DropdownMenu` does not set it (`DropdownMenu.tsx:152-160`). So the menu is a `role="menu"` nested in a `role="dialog"` with a dismiss button — exactly what #183 reports. Whether Tab is trapped could not be tested.
3. **Selection is not announced, and cannot be with the current structure.** The checked state is only a decorative icon: `MenuItemBody` renders `<Checkmark2>` (`menu/MenuItemBody.tsx`), the SVG has no `aria-hidden`/`role` (`icon/IconSvg.tsx`), and each `MenuItem` sets `aria-label` to the label alone (`DropdownMenu.tsx:83` and `:109`), which replaces the content and hides sub-text and the check. The `Menu` has no `selectionMode`, so items are plain `menuitem`s with no `aria-checked`.
4. **The focus contrast defect is real and measured:** the focused item background `--c--contextuals--background--semantic--contextual--primary` is `#1B1B230D` in the default theme, i.e. `#F3F3F4` on `#FFFFFF`, contrast **1.11:1** (and `#F8F8F90D` on `#2F303D` in dark). This is a shared style (`dropdown-menu/index.scss:104-108`) used by `DropdownMenu`, `ContextMenu` and `Filter` rows.
5. **There is no unit test for `DropdownMenu` and the existing e2e rely on the current markup.** The only checks are Playwright specs for help-menu, context-menu and filter, and the context-menu spec asserts "checked" through the CSS class `.c__dropdown-menu-item__check` (`e2e/context-menu/context-menu-checked.spec.tsx`). Adding selection semantics must keep that class.

## Target story
**As a** keyboard and screen-reader user **I want** the dropdown menu to be fully operable and to handle long labels **so that** I can use it in every application. Complexity scored 2.
Acceptance criteria:
- Every item of `DropdownMenu` is reachable and activatable with the keyboard (arrows, Enter, Escape) and exposes the correct roles and states (tests and accessibility check).
- An option whose label is longer than the menu width is truncated or wrapped without overflowing the menu or hiding adjacent options.
- Selected options are announced to assistive technology.

Upstream: ui-kit #183 (accessibility, RGAA 7.1, 7.3, 10.7, 12.9, severity blocking) and #309 (long text, which only links to `suitenumerique/docs#2618`).

## Current state of the code
- `components/dropdown-menu/DropdownMenu.tsx` (185 lines): React Aria `Popover` + `Menu` (`autoFocus="first"`, `aria-labelledby` the trigger wrapper id) + `MenuItem`s; submenus through `SubmenuTrigger`; `onAction` calls `onSelectValue`, `callback`, then `onOpenChange(false)` unless `keepOpen`.
- `components/dropdown-menu/types.ts`: `DropdownMenuOption = MenuItemAction & { value?, showSeparator? }`; `components/menu/types.ts`: `MenuItemAction` (label, subText, icon, callback, isDisabled, isHidden, isChecked, variant, keepOpen, testId, children, opensInNewWindow).
- `components/dropdown-menu/index.scss`: `.c__dropdown-menu` has `max-width: min(320px, calc(100vw - 32px))`; `.c__dropdown-menu__list` has `overflow: auto`; the label has `flex: 1` and **no** `min-width: 0`, no `overflow-wrap`, no ellipsis; the `--tiny` variant fixes the row at `height: 16px`.
- Consumers (8): `feedback-form/FeedbackForm.tsx`, `language/language-picker.tsx`, `preview/FilePreview.tsx`, `help-menu/HelpMenu.tsx`, `share/access/AccessRoleDropdown.tsx`, `share/modal/ShareMembersActions.tsx`, `share/modal/items/ShareLinkSettings.tsx`, `ShareMemberItem.tsx`, `ShareInvitationItem.tsx`. `menu/MenuItemBody.tsx` is also used by `ContextMenu` and `Filter`.

## Anchor points
- Roles / popover: `DropdownMenu.tsx` `<Popover … isOpen … onOpenChange>` (`isNonModal` is the lever to test).
- Item semantics and selection: the `Menu` props (`selectionMode`, `selectedKeys`) and each `MenuItem` (`aria-label`, `onAction`) in `DropdownMenu.tsx`.
- Visuals: `dropdown-menu/index.scss` (`[data-focused]`, label container, `--tiny`).
- Check icon: `menu/MenuItemBody.tsx`.
- Tests to add: a Vitest spec next to the component (none exists) and e2e roles queries like `help-menu.spec.tsx` already use `getByRole("menuitem")`.

## Verified APIs / functions
- `DropdownMenu(props: PropsWithChildren<DropdownMenuProps>)` — `DropdownMenu.tsx:35`; `DropdownMenuProps` fields: `options`, `onOpenChange`, `selectedValues`, `onSelectValue`, `isOpen`, `bottomMessage`, `topMessage`, `shouldCloseOnInteractOutside`, `variant`.
- React Aria `Popover` role logic — `react-aria-components@1.16.0/src/Popover.tsx:189-227`.
- `MenuItemBody({ icon, label, subText, isChecked, hasSubmenu })` — `menu/MenuItemBody.tsx`.
- `Checkmark2` — generated icon, `fill="currentColor"`, no accessibility attributes.

## Traps & constraints
- **Behaviour change risk**: switching to `selectionMode` makes items `menuitemradio`/`menuitemcheckbox` and routes selection through `onSelectionChange` instead of `onAction`; every consumer relies on `onAction` + `onSelectValue` + `callback`. Make the change without breaking those three.
- **Controlled-only open state**: Escape calls `onOpenChange(false)`; if a caller ignores it, the menu stays open. Acceptance "Escape closes" depends on the caller, not only on the component.
- **Accessible name**: `aria-label={option.label}` hides `subText`; removing it changes names that e2e specs query (`getByRole("menuitem", { name: "Documentation" })`).
- **`--tiny` fixed height (16px)** will clip any wrapped text; truncation must be chosen for it separately.
- **Shared styles**: the focus background and the label rules are shared with `ContextMenu` and `Filter`; a change there reaches both.
- **Nested dialog**: removing `role="dialog"` through `isNonModal` also removes the underlay and dismiss button; click-outside behaviour (`shouldCloseOnInteractOutside`) needs re-checking.
- Dependencies are not installed in any worktree (corrupted Yarn cache); nothing could be executed.

## Open questions
1. **What is the actual long-text repro of #309?** It links to `suitenumerique/docs#2618` ("text too long for slides link sharing", French labels, two screenshots not readable here). That points to the share-link dropdown (`ShareLinkSettings.tsx`) with normal words — which should already wrap — not to an unbroken string. The real defect may be a width problem in that consumer rather than in `DropdownMenu`.
2. Truncate or wrap? The criterion allows both; truncation hides text from sighted users unless a tooltip is added.
3. Does Tab actually get trapped, and does Escape close in the real DOM? Needs a running Storybook once the Yarn cache is repaired.
4. Which of #183's six points are in scope for this story? "Trigger `aria-expanded`" lives in 8 callers; "div instead of button" is how React Aria renders `menuitem` (correct ARIA) and may not need a change.
5. Fix the focus contrast of items (1.11:1)? It is in #183 but not in the story's criteria.

## Real complexity
Scored **2** in docs/stories.md; real: **4**. Reasons: six defects spread over the component, its shared styles and 8 consumers; selection semantics change the interaction model (`onAction` → selection) of a component used by `ContextMenu`/`Filter`/Share; no unit test exists; the long-text defect is not reproduced; and the result cannot be run here. Not a 5: no new subsystem and the work is local to `dropdown-menu/` and `menu/`.

## Split proposal
Cut into two stories so each closes on its own:
- **s02a — operable and announced:** popover role (`isNonModal`), selected state announced, accessible names keep `subText`, tests for keyboard/roles. Closes the first and third acceptance criteria.
- **s02b — long labels and focus contrast:** wrapping/truncation (and the `--tiny` variant), focus background contrast, once #309 is reproduced. Closes the second criterion and the 1.11:1 defect.
The caller-side `aria-expanded` is a separate ticket per consumer family (Share, HelpMenu, Preview, Language, FeedbackForm), decided at planning.
