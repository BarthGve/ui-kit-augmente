# Review s07-filters-update / t01-filters-state-guards

Branch verified: `feature/s07-filters-update/t01-filters-state-guards`. Diff `next...HEAD`: 8 files, tests, stories, one MDX line and the plan checkboxes. No production file (Filter.tsx, FilterResetRow.tsx, SearchFilter.tsx, UserSearchFilter, index.scss, types.ts, index.tsx, cunningham.ts, locales, tokens, e2e/helpers) is in the diff: byte-identical to `next`. Nothing user-visible changes, so "Artifact: not applicable" holds (the main agent adds the PR line; noted only).

## Facts run myself
- `TZ=UTC yarn test --concurrency=1` (root): 50 files, 1042 tests green.
- `yarn lint` ok, `yarn check-locales` ok, `yarn build` ok, `tsc --noEmit` ok (stories and specs compile).
- CT chromium (headless-shell 1243 via executablePath, throwaway config on the dm-port port 21772, deleted): `e2e/filter` + `e2e/search-filter`, 31 passed. The new keyboard-only Filter CT passes.
- `cunningham-tokens-sass.scss` was rewritten by test and build; restored with git. Final `git status` clean. No orphan vitest or playwright worker (only unrelated playwright-mcp processes, not mine).

## Mutations (production file restored with `git checkout`, `git diff --exit-code` clean each time)
Run on filter + search-filter specs (53 tests):
- items shown while loading: 1 red
- drop `!isLoading` on the empty row: 1 red
- `onItemSelect(undefined)` in the input onChange: 1 red
- SearchFilter `showReset` removed: 1 red
- Filter `showReset` removed: 1 red
- Filter `setValue(null)` replaced: 3 red
- Filter `--active` always: 1 red; SearchFilter `active = true`: 4 red
- `aria-haspopup` deleted (SearchFilter): 6 red
- contrast: active text swapped for the surface colour: 6 red (one per theme)
- `Escape` branch of `handleInputKeyDown` neutralised: **0 red**.

## Escape guard
The plan's mutation cannot go red: React Aria's Popover closes and restores focus on Escape by itself, the branch exists for WebKit only (its own comment). The two Escape tests do guard the observable behaviour (closed, focus back on the trigger, from input and from listbox) and the spec comment says what is observed. The branch itself is untested in jsdom and chromium; a WebKit CT would be needed. The ticket reports this honestly and does not ship a fake test. Acceptable.

## Plan vs diff
Tasks 1 to 10 are all done; checkboxes ticked with factual notes. Nothing beyond the plan. The tab order (input, first option, Reset, input) differs from the plan text but the plan asked to observe then pin; it is pinned with a comment. The 6 SearchFilter states include loading-over-empty and the silent empty-without-`emptyState` case, both pinned and commented. AC1 (states + stories), AC2 (active, reset), AC3 (loading/empty, selection kept while searching: mutation red), AC4 (keyboard, jsdom + CT) are each covered.

## Tests quality
Exact-DOM literals are heavy but are the planned technique, normalised (ids, icon data, popover style) and each mutation of a class, text or state turned them red, so they bite. No vacuous assertion found. The contrast helper reads the generated `cunningham-tokens.css`, resolves each theme against `:root`, composites alpha; the formula (WCAG relative luminance) is correct. The failing pair `neutral.tertiary` on `neutral.tertiary-hover` is deliberately excluded and the exclusion is commented and defers to t04.

## Findings
- minor: Escape branch of `handleInputKeyDown` has no test that fails when it is removed (WebKit-only; see above). Follow-up: a WebKit CT run if the project wants it.
- minor: the plan's unmount guards (pointerdown listener, requestAnimationFrame focus after unmount) from the test strategy are not covered; no task assigned them. Acceptable, noted.
- minor: `Filter` `Open` story sets `docs.story.inline: false`; consistent with the stated cause (modal popover locking autodocs). Stories compile; I did not render Storybook myself.
- minor (pre-existing, not this diff): axe `aria-dialog-name` on the SearchFilter popover (role=dialog without a name) shows in the Open story; needs a production change, belongs to a later ticket.
- no contradiction with research or ADRs found.

## Could NOT verify
- Storybook rendering of the new stories and axe results (not launched; the author's claim of 0 violations except the dialog name is unconfirmed). Gesture: open Filter/Open, SearchFilter/Active and /Open in Storybook on the worktree port and run the a11y panel.
- WebKit and Firefox behaviour (only chromium CT run).
- Docs autodocs page layout with `inline: false`.

Max severity: minor
Ship allowed: yes
