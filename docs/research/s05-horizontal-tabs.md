# Research — Story s05-horizontal-tabs

Worktree `.worktrees/s05-horizontal-tabs`, branch `feature/s05-horizontal-tabs`. Nothing was built or run except a throwaway node script (contrast, outside the repo). Sources read: `components/tabs/*`, `e2e/tabs/tabs.spec.tsx`, `e2e/helpers/mount-tabs.tsx`, git history of `tabs/`, `src/cunningham-tokens.css`, `react-aria-components` 1.16.0 (read-only, main checkout).

## The structuring fact: the premise is false, the design is already shipped
Upstream issue suitenumerique/ui-kit #231 ("New horizontal tabs") has one image, which **is readable** (downloaded from the user-attachments URL, 2560x396). It shows two Figma components:
- **"Tab Horizontal"**: icon + label, neutral text; rest = grey text, hover = light grey pill, selected = darker grey pill and dark text.
- **"Tab Horizontal Line"**: icon + label; rest = grey text, hover and selected = dark text, selected adds a dark underline.

The issue body calls them "Classic" and "Line". Comments (robin-lecomte, lysianelagadic): selected state black/neutral, not blue ("tabs are options, blue is for actions"); worry that a variant without underline may need a background against the content; segmented controls are a separate component (that is s13-selector).

Current code (`Tabs.tsx`, `index.scss`), delivered by commit `3b5e9d4e` (2026-09-22, "add accessible variants and controlled selection"):
- `variant?: "default" | "line"`: `default` = filled pill (`overlay.primary` background on hover and selected, neutral colours), `line` = underline (`SelectionIndicator`, 1.5px, `currentColor`, slides between tabs), no background. **Both are neutral, no blue.** `Tabs.mdx` already says it "follows the horizontal tabs design in Figma" (node 13516-883, same node as the Storybook `design` parameter).
- Before that commit (`CustomTabs`, no variant) selection was brand-blue with a 2px bottom border: that is what #231 replaced.

So `default` = "Classic" and `line` = "Line". **Story AC1 ("offers the new horizontal appearance through the existing `variant` option ... without changing `default` and `line`") cannot be satisfied by a new variant: the new appearance IS `default` and `line`.** A third variant would duplicate one of them. Recommendation: do not add a variant; no new name to choose; no ADR. The PRD line "Visual variant, must stay backward compatible" is already met.

## AC by AC against the current code
- **AC1** story + snapshot test, `default`/`line` unchanged. Stories exist (`Default`, `Line`, `WithIcons`, `LineWithIcons`, `FullWidth`, `FullWidthLine`, `Overflow`...). **No snapshot test exists** anywhere in the repo (`grep toMatchSnapshot|toMatchInlineSnapshot` finds none; the only `toHaveScreenshot` is a PDF golden in `e2e/file-preview`; no `__snapshots__` directory). Tabs has **no Vitest spec at all**; its tests are Playwright CT only (`e2e/tabs/tabs.spec.tsx`, loop over `default` and `line`: ARIA, selection, keyboard, icon-only, height 26/30px, full width, overflow, forced colors, indicator animation, reduced motion). Closest honest guard: a jsdom DOM assertion (ids normalised) plus textual assertions on `index.scss` (s10/s11 technique), proven by mutation. Visual screenshots are not offered (chromium only locally, fonts and OS rendering make goldens brittle).
- **AC2** arrow keys, automatic and manual. Implemented by React Aria: `keyboardActivation` is passed straight to `<AriaTabs>` (`Tabs.tsx`). In RAC/`@react-aria/tabs` `useTab`/`useTabList`: Left/Right (orientation horizontal; RTL aware), Home, End move focus with wrap through `TabsKeyboardDelegate` and skip disabled tabs; with `keyboardActivation="automatic"` (default) focus change selects (`selectOnFocus`), with `"manual"` it only focuses and Enter/Space selects. Covered today by CT tests "navigates by keyboard, wraps, and skips disabled tabs" and "manual activation separates focus from selection" in both variants. **Already true**; no jsdom coverage.
- **AC3** no overflow on narrow viewport. `__list` has `overflow-x: auto`, tabs `flex: 0 0 auto`, `white-space: nowrap`, root `min-width: 0; max-width: 100%`. CT test "scrolls long tab lists without overflowing the container" (container 180px, both variants, End key scrolls the focused tab into view). Gap: no test at a real narrow **viewport** (page-level horizontal scroll), no scroll buttons or SmartScroller (none used; native scroll only). Not a defect, a coverage gap.

## Backward-compat surface
Callers use `variant`, `fullWidth`, `keyboardActivation` (all in `TabsProps`), plus `tabs`, `defaultSelectedTab`, `selectedTab`, `onSelectionChange`, `aria-label(ledby)`, `className`, `id`. Class names a consumer may style: `c__tabs`, `c__tabs--default|line`, `c__tabs--full-width`, `c__tabs__{list,tab,icon,label,indicator,panel}`. Any change to these would break callers: the plan changes none.

## Tokens
Tabs has **no `tokens.ts`** and no `--c--components--tabs--*` variables (not in `cunningham.ts`, not in the sass copy); `index.scss` reads global contextual tokens directly and keeps literals in the stylesheet (`18px`, `18px` line-height, `1.5px`, `2px`, `1px`). That predates the ADR 002 convention. Adding component tokens would change the shipped CSS of `default` and `line` (new variables, new declarations) and regenerate six theme blocks: out of scope and against the interdict. Listed as design-system debt, not fixed.

## Contrast (computed from `src/cunningham-tokens.css`, 6 themes, overlay composited on the surface)
Technique of `button/focus-ring.spec.tsx` (resolve `var()` chains per theme, WCAG 2.x). Minimum over the six themes:
| Pair | Min | Max | Verdict |
|---|---|---|---|
| rest text `neutral.tertiary` on surface | 5.36 | 6.69 | pass 4.5 |
| selected text `neutral.primary` on `overlay.primary` (default selected/hover) | 9.87 | 13.73 | pass |
| `neutral.tertiary` text on `overlay.primary` (default hover, text unchanged) | 4.83 | 5.78 | pass 4.5 (thin margin, default theme) |
| line selected/hover text and underline (`currentColor` neutral.primary) on surface | 11.46 | 15.23 | pass 4.5 and 3 |
| focus ring `content.brand.primary` (existing) on surface / on overlay | 9.00 / 8.11 | 11.62 / 10.02 | pass 3:1 |
| disabled text `content.disabled.primary` on surface | 2.03 | 2.30 | below 4.5, WCAG-exempt (disabled), existing |
| `overlay.primary` pill vs surface (non-text) | about 1.1 | | below 3:1, see open question 2 |
No existing token fails where WCAG applies. The ring `brand.tertiary` rationale of s11 (ring on an `overlay` hover row in dark themes below 3:1 with `border.brand.primary`) does **not** apply: Tabs' ring uses `content.brand.primary`, which is at least 8:1 here. Do not change it (would alter `default`/`line`).

## Narrow viewport, forced colors, reduced motion (as they are)
Narrow: native horizontal scroll of the list, focus keeps the tab in view (browser). Forced colors: selected tab outlined with `Highlight`, disabled `GrayText`, ring `Highlight`; the line indicator is a background (dropped in forced colors) but the selected outline covers it (CT test exists). Reduced motion: indicator transition `none` (CT test exists).

## Complexity re-score
Story says 2. With the premise false the remaining work is a coverage and documentation ticket: **1** (size S, 1 day). If the owner wants the hover/selected distinction below, complexity returns to 2.

## Existing-code traps for any future work here
- `useControllableState` is not used by Tabs (RAC `selectedKey`); wrap, do not modify it, if ever needed.
- `onSelectionChange` is called with `String(key)`.
- RAC generates ids (`react-aria…`); a DOM snapshot must normalise them.
- CT `TestTabs` helper theme defaults to `dsfr-light`.

## Open questions (for the owner)
1. **Confirm the story is closed by the existing variants.** The plan then reduces to a guard ticket (below). If the owner expects a third look, the issue does not describe one.
2. **Selected vs hover in the `default` variant.** The image shows hover lighter than selected; the code paints both with `overlay.primary`. `overlay.primary-hover` exists (about 0.1 darker), so selected could use it. That changes `default`, so it is **not planned**; it needs an explicit owner decision (it would amend the AC "unchanged"). Related: the selected `default` tab differs from rest by lightness and text colour only, with a pill about 1.1:1 against the surface; the `line` variant has an underline. The comment "no underline may need a background to separate it from content" is met by the pill.
3. Figma node 13516-883 and the exact pixel values (pill radius, 26px/30px heights, 1.5px line) were not compared with Figma (no access); the image was read by eye only.
4. Segmented control: separate component (s13). Nothing to do here.
