---
validated: yes
---
# Plan — Story s07-filters-update

Branch: `feature/s07-filters-update` (framing) · ticket: `feature/s07-filters-update/<ticket-id>`
Research: `docs/research/s07-filters-update.md` — read it first. Design: `docs/designs/s07-filters-update.md`.

## Target story
**As a** user searching a list **I want** the updated filters **so that** I can narrow results as designed. Complexity 3 in stories.md, **2 after research**.
**The premises are partly false** (details in the research): ui-kit #259 describes a filter bar (icon, overflow arrows, trailing reset, "buttons instead of a component") that none of the ACs asks for and that nothing in the code implements; `onReset` does not exist; `Filter` has no loading/empty state; no Vitest spec or snapshot exists for either component; no component tokens exist. The plan keeps the shipped look, adds guards, one additive prop and the token rewrite. The #259 bar is a new story (and an ADR if `Filter` is to be deprecated).

Acceptance criteria (docs/stories.md), as reinterpreted (open question 1: Filter has 3 applicable states):
- AC1 Storybook story per state (Filter: default, active, open; SearchFilter: default, active, open, loading, empty), covered by a DOM test; every colour, spacing and radius from a token.
- AC2 Selecting an option marks the filter active; the reset row clears it and calls `onReset`.
- AC3 SearchFilter shows loading and empty states; searching does not lose the selection.
- AC4 Both operable by keyboard.

## Tickets (ordered)
### t01-filters-state-guards
- **size:** M
- **estimate:** 2d
- **depends on:** none
- **scope:** stories, tests, one sentence in `SearchFilter.mdx`. **No change to `Filter.tsx`, `SearchFilter.tsx`, `FilterResetRow.tsx`, `index.scss`, `types.ts`, tokens.** New: `components/filter/Filter.spec.tsx`, `components/search-filter/SearchFilter.spec.tsx` (jsdom), additions to `e2e/filter/filter.spec.tsx`, `e2e/search-filter/search-filter.spec.tsx` (CT) and their `mount-*` helpers if needed, new stories. Covers AC1 (stories + DOM), AC2 (active, reset), AC3, AC4.

Tasks (guards of existing behaviour: green from the start, each **proven able to fail by a mutation** that is reverted and recorded in the PR; no `it.fails` ships):
1. [x] _(done: Filter `Open` (docs `inline: false`, its modal popover locked the autodocs page), SearchFilter `Active` and `Open`; rendered in Storybook on the worktree port, axe 0 violations except the pre-existing unnamed SearchFilter popover dialog, see PR)_  Stories first: `Filter` `Open` (`defaultOpen`, decorator with height); `SearchFilter` `Active` (`selected` + `activeLabel`) and `Open` (`isOpen`). Existing stories stay as they are. Check they render in Storybook on the port from `bash .dm/lib/dm-port.sh` (never 6006), stop what you started.
2. [x] _(done: 3 exact DOM strings; mutations rename `--active` 2 red, drop `" : "` 4 red, `--active` always 1 red, plus no checkmark 1 red, no `opened` 1 red)_  `Filter.spec.tsx` (import `it` from `vitest`, `TZ=UTC`, `CunninghamProvider`) — AC1/AC2 DOM guard: exact markup compared with `toBe` on a literal (react ids `«r\w+»` and `react-aria\d+-…` normalised to `ID`, icon `d=` data stripped; `document.body.innerHTML` because the popover is portalled) for default, active (`defaultSelectedKey`) and open (`defaultOpen`): classes `c__filter`, `c__filter__button`, `--active` only when a value exists, `"label : option"`, `aria-expanded`, the `opened` class on the chevron, the checkmark on the selected row. Mutations: rename `--active`, drop the `" : "` text, render `--active` always: each red.
3. [x] _(done: 6 states + loading-over-empty case; items while loading 1 red, no `!isLoading` on the empty row 1 red after adding that case, rename `__empty` 1 red)_  `SearchFilter.spec.tsx` — same technique for default, active, open, loading (spinner row, no data options), empty (`emptyState` row; **and the silent case: empty items without `emptyState` renders no row**, pinned as current behaviour, commented as such). Uses a controlled harness inside the spec (stateful wrapper). Mutations: show items while `isLoading`, drop the `!isLoading` guard of the empty row, rename `c__search-filter__empty`: red each.
4. [x] _(done: `onItemSelect(undefined)` in `onChange` 1 red)_  `SearchFilter.spec.tsx` — AC3 selection kept: with `selected`/`activeLabel` set, open, type in the input until `items` filters the selected item out; assert the trigger name still `Label : Selected` and the reset row still present; `onItemSelect` not called by typing. Mutation: call `onItemSelect(undefined)` inside `onChange`, or clear on search: red.
5. [x] _(done: remove `setValue(null)` 3 red, drop Filter `showReset` 1 red, drop SearchFilter reset call 1 red, drop SearchFilter `showReset` 1 red)_  Both specs — AC2 reset today: Filter reset calls `onSelectionChange` once with `null`, keeps the popover open and drops `--active`; SearchFilter reset calls `onItemSelect(undefined)` once; `showReset={false}` and no value hide the row. Bounded input (3 options). Mutation: remove `setValue(null)`, or the `showReset` condition: red.
6. [x] _(done, observed first in jsdom and chromium: Tab inside the SearchFilter popover cycles input, first option, reset, input, the trigger is out of the cycle; Escape from the listbox closes and restores focus via React Aria. `aria-haspopup` deleted 6 red; **the `Escape` branch of `handleInputKeyDown` deleted: 0 red in jsdom and in CT chromium**, React Aria's Popover dismisses and restores focus by itself; the branch is only for WebKit per its comment, not run here)_  Both specs — AC4 keyboard (userEvent): Filter opens with Enter, Space and ArrowDown, arrows move, Enter selects and closes, Escape closes and focus returns to the trigger, reset row reached by Tab and activated by Enter and Space; SearchFilter: Enter opens and the input is focused, ArrowDown reaches the first option, Enter selects, Escape from the input (and from the listbox: **observe the real behaviour first, pin it, do not assume**) restores focus to the trigger, Tab order trigger then reset then input. Mutation: delete the `Escape` branch of `handleInputKeyDown`, delete `aria-haspopup`: red.
7. [x] _(done: uses the existing `TestResetFilter`; drop `" : "` turns it red in chromium)_  CT first, in `e2e/filter/filter.spec.tsx`: plain Filter open and select with the keyboard only (no sub-panel). Existing CT tests stay. Clear `playwright/.cache` between CSS mutations (none here).
8. [x] _(done: 4 pairs x 6 themes, ratios match the research; the 4.16-4.21 hover pair is not asserted (STOP, t04); active text swapped for `border.surface.primary` 6 red)_  Contrast guard in the six themes (technique of `button/focus-ring.spec.tsx`, helpers copied locally, known duplication) in a `contrast.spec.tsx` next to `Filter.spec.tsx`: rest text, active text (`brand.primary` on `brand.secondary` and `-hover`), loading/empty text on surface, at least 4.5:1. **The hover/focus pair `neutral.tertiary` on `neutral.tertiary-hover` is 4.16 to 4.21 in the three light themes and fails: STOP, do not change a token, do not assert it, report it (already in the research; the PR says so; t04 is the owner's decision).** Mutation: swap active text for `border.surface.primary`: red.
9. [x] _(done)_  `SearchFilter.mdx`: one line listing the states and their stories. No changeset (tests, stories, docs). PR line `Artifact: not applicable (stories, tests and docs only)` (main agent confirms).
10. [x] _(done: lint 0 errors, check-locales, 1042 tests green, build, CT chromium 31 green; sass tokens restored from next after test and build)_  `yarn lint`, `yarn check-locales`, `TZ=UTC yarn test --concurrency=1`, `yarn build`, CT chromium for `e2e/filter` and `e2e/search-filter` (throwaway uncommitted config on the `dm-port.sh` port, stop what you started, no broad `pkill`). Restore `cunningham-tokens-sass.scss` if rewritten (nothing should be).

### t02-filters-on-reset
- **size:** XS
- **estimate:** 0.5d
- **depends on:** t01-filters-state-guards
- **scope:** `FilterProps.onReset?: () => void`, `SearchFilterProps.onReset?: () => void` (`UserSearchFilterProps` inherits it), called **in addition to** the existing `onSelectionChange(null)` / `onItemSelect(undefined)`, never instead. `FilterResetRow` unchanged. No visual change. Covers AC2.

Tasks (red first):
1. [x] _(done: 6 red before the code, all on `onReset` not called; the t01 `open` DOM guard now also passes `onReset`)_  In the two specs, write failing tests: reset click calls `onReset` exactly once and the existing callback still fires once; keyboard (Enter, Space) too; `onReset` absent changes nothing (t01 tests stay green); not called by selecting an option or by `showReset={false}` (row absent). Run: red.
2. [x] _(done: 55/55 green; `open` DOM guard now passes `onReset`)_  Implement: `Filter` passes `onReset` into the reset row callback (`state.setValue(null)` then `props.onReset?.()`); `SearchFilter` likewise. Be careful that `Filter` spreads `{...props}` onto RAC `Select`: **destructure `onReset` out** so it never reaches the DOM or `Select`; the DOM guard of t01 proves no attribute leaks. Green.
3. [x] _(done: SearchFilter onReset-only 3 red, Filter onReset-only 3 red, onReset on every selection Filter 4 red / SearchFilter 1 red; `onReset?.()` made non-optional 1 red per component (the reset tests run with and without `onReset` and fail on any error reported on `window`); leaking `onReset` into RAC `Select` 0 red: a DOM-string guard cannot see a function prop, so the destructure is unguarded)_  Mutations: call `onReset` before clearing is irrelevant; drop the existing `onItemSelect(undefined)` call in favour of `onReset` only: t01 red; call `onReset` on every selection: red.
4. [x] Stories: add `onReset` to the `WithReset` story of `Filter` and to `SearchFilter` argTypes (`description`, type summary); mdx sentence.
5. [x] _(done: lint, check-locales, `TZ=UTC yarn test --concurrency=1` 1044/1044, build green; PR artifact line left to the main agent)_  Changeset `minor` for `@gouvfr-lasuite/ui-components` ("Filter and SearchFilter: optional `onReset`"). PR line `Artifact: updated (version <id>)`: the component pages' props and the catalogue entry (done by the main agent). Lint, check-locales, `TZ=UTC yarn test --concurrency=1`, build.

### t03-filters-component-tokens
- **size:** S
- **estimate:** 1.5d
- **depends on:** t01-filters-state-guards (t02 independent; either order, rebase)
- **scope:** `components/filter/tokens.ts` and `components/search-filter/tokens.ts` (values of the design doc, copied from the current stylesheets), registration in `cunningham.ts`, both `index.scss` use `var(--c--components--filter--…)` / `…search-filter--…` only, `yarn build-theme`. **Computed styles unchanged.** Covers AC1 tokens.

Tasks:
1. [x] _(done: red first on literals in both stylesheets; literal back (`height: 32px`, `max-height: 240px`) 4 red, `var(…, 8px)` fallback back 3 red, bare `font-weight: 500` 2 red)_  Test first, stylesheet guard in `Filter.spec.tsx` / `SearchFilter.spec.tsx` (read the `.scss` from disk: vitest stubs stylesheets): fails today because literals exist. Assert no `px`, `rem`, `em` number, hex, `rgb(`, bare font-weight number outside comments and outside `var(--…)` names, no literal fallback inside `var(--…, X)`, and that each expected `--c--components--filter--…` name is used. Red first, green after the rewrite.
2. [x] _(done: 13 filter keys, 8 search-filter keys; `item-gap`, `popover-border-width`, `popover-radius` added beyond the design list (literals of the same stylesheet); value drift 2 red; registration removed 12 red)_  Token test: `tokens(defaultTokenRefs)` returns the exact values listed in the design doc (so a token drift is red) and `cunningham.ts` registers both (keys present in `cunningham-tokens.css` after build, six themes).
3. [x] _(done: contrast guard green; generated css/scss/ts diffs are only the new filter and search-filter blocks, six themes)_  Rewrite both `index.scss`; keep selectors, nesting and declaration order; replace each literal by its token; remove the literal fallbacks. Contrast guard of t01 still green; the six-theme `cunningham-tokens.css` diff shows only new `--c--components--filter--*` and `--search-filter--*` lines.
4. [x] _(done: before and after identical, 34 green; chevron size not checked (`.material-icons` 24px wins in CT); token value changed + rebuild 2 red in CT)_  CT computed-style check (chromium, `e2e/filter`, `e2e/search-filter`): trigger height 32px, border radius 4px, border 1px, font-size 14px, padding `0px 6px 0px 8px`; popover width bounds 240 to 320px; search row height 36px; list max-height 240px. Same numbers before and after the rewrite (record the "before" run in the PR). Mutation (clear `playwright/.cache` each time): change a token value in `tokens.ts`, rebuild: red; put a literal back in the stylesheet: stylesheet guard red.
5. [x] _(done: sass file restored from HEAD, the 12 blocks hand-added, its added lines equal the generated scss ones, 0 deletions)_  `yarn build-theme` rewrites generated files: `src/cunningham-tokens.*` are never hand-edited. If `cunningham-tokens-sass.scss` is rewritten, restore the tracked version and **hand-add only the new token blocks**, diff-verified (flag it in the PR).
6. [x] _(done: lint 0 errors, check-locales, 1064 tests, build, CT chromium 34; PR artifact line left to the main agent)_  Changeset `patch` (internal tokens added, no behaviour change). PR line `Artifact: updated (version <id>)` (tokens listed on the two component pages, by the main agent). Lint, check-locales, `TZ=UTC yarn test --concurrency=1`, build, CT chromium.

### t04-filters-contrast-and-a11y-polish — DEFERRED (owner decision)
- **size:** S
- **estimate:** 1d (not counted in the US total)
- **depends on:** t03-filters-component-tokens
- **scope:** changes visible or announced behaviour beyond the ACs: (a) trigger hover/focus label colour `neutral.tertiary` to `neutral.secondary` (4.16 to at least 4.99:1); (b) an explicit trigger focus ring (`content.brand.tertiary`, at least 3.62:1 on every trigger background, tested in six themes); (c) accessible name for the loading and empty rows (one locale key in five locales, `role=status`/`aria-busy`). **Not executed unless the owner approves** (research open question 4); the autonomous run skips it and reports it.

## US totals
- **Person-days:** 4.0 (t04 DEFERRED, 1.0 excluded)
- **Size mix:** 1×M, 1×S, 1×XS (+ 1×S deferred)
- Split needed: no.
- ADR needed: **no** for this plan. Deprecating `Filter` for Button-based filters (#259 point b) would need an ADR (ADR 005 stays free), in a separate story.

## Run interdicts
- No change to the rendered output, class names, existing props or computed styles of `Filter`, `SearchFilter`, `UserSearchFilter` (proved by the t01 DOM guards and the t03 computed-style check). The only API change is the optional `onReset`.
- No new dependency; no breaking prop change; no new locale key (outside the deferred t04); no new global token; no `useControllableState` use (wrap, never modify it, if ever needed).
- Do not edit generated `src/cunningham-tokens.*`. Do not change any existing token; a failing existing token is a STOP-and-report.
- The #259 visuals (icon, overflow arrows, trailing reset, button-based bar) are out of scope.
- Never port 6006, never broad `pkill`, a ticket never merges with a red test.

## Files touched
`components/filter/{Filter.spec.tsx,contrast.spec.tsx,tokens.ts,index.scss,Filter.tsx,Filter.stories.tsx}`, `components/search-filter/{SearchFilter.spec.tsx,tokens.ts,index.scss,SearchFilter.tsx,types.ts,SearchFilter.mdx,search-filter.stories.tsx}`, `cunningham.ts`, `e2e/filter/filter.spec.tsx`, `e2e/search-filter/search-filter.spec.tsx`, `.changeset/*`.

## Test strategy
jsdom (Vitest, Testing Library, userEvent): exact DOM strings per state, textual stylesheet guard, keyboard, selection kept, contrast. Playwright CT chromium: real keyboard, computed layout values before and after the token rewrite. jsdom does not render SCSS, hence the textual guard. Lessons applied: `TZ=UTC`; exact DOM strings with normalised ids; bounded inputs (3 options, fixed labels); contrast in six themes with STOP; guard tests for unmount/cleanup (the `pointerdown` listener of `Filter` and the `requestAnimationFrame` focus of `SearchFilter`: unmount mid-open, assert no listener left and no focus steal, proven by removing the cleanup); no broad `pkill`; clear `playwright/.cache` between CSS mutations; hand-added sass blocks diff-verified; every guard proven by mutating production code.

## Definition of Done
Per ticket: single PR into `next`, structured description (false-premise statement, mutation log, STOP finding), readable diff, lint, check-locales, `yarn test --concurrency=1`, build and CT green, review `Ship allowed: yes`, merged to `next`.
