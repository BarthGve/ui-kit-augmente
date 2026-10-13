# Review — Ticket s07-filters-update/t04-filters-contrast-and-a11y-polish

> Fresh-context review. Diff reviewed: `git diff next...feature/s07-filters-update/t04-filters-contrast-and-a11y-polish`

## Plan compliance
- [x] (a) hover/focus label `neutral.tertiary` to `neutral.secondary` via new token `button-color--hover`; (b) tokenised focus ring on `:focus-visible` (`focus-ring-color/width/offset`); (c) PARTIAL, see below.
- [x] Run interdicts: no existing token changed (only additions in the filter block), no new dependency, generated `cunningham-tokens.*` only rewritten by build-theme, `search-filter/tokens.ts` and `index.scss` untouched (consistent: SearchFilter trigger reuses `.c__filter__button`), the only new locale key is the one the approved t04 allows.
- [x] `cunningham-tokens-sass.scss` +30/-6, hunks identical to the generated `cunningham-tokens.scss` (diffed: SAME); nothing else changed in it. The test run rewrote it, restored with `git restore`.

## Anti-hallucination
- [x] `useCunningham` from `:/components/provider`, `t("components.searchFilter.loading")`, `aria-labelledby` on RAC `Popover` (id of the trigger): all exist. Dialog name test resolves ("Category : Banana").
- [x] Own WCAG measurement (parsed `cunningham-tokens.css`, six themes, alpha composited): hover label on `neutral.tertiary-hover` 4.99 / 10.12 / 5.00 / 10.17 / 5.04 / 10.25 (>= 4.5). Ring min per theme: default 3.63 (on brand.secondary-hover), dsfr-light 3.62, anct-light 3.66, all dark >= 4.57; all >= 3:1 on surface, rest, hover, active, active-hover.
- [x] Five locales carry `components.searchFilter.loading` (check-locales: aligned).

## Security
- [x] No input handling, injection, authz, secrets or XSS surface in this diff.

## Factorization
- [x] Ring defined once in `filter/index.scss`, shared by SearchFilter. Contrast helpers duplicated locally, already a recorded known duplication.
- [x] No speculative abstraction.

## Rules compliance
- [x] Tokens go through `tokens.ts` then build-theme; styles only from `--c--components--filter--*`; BEM unchanged; changeset `patch` present.
- [x] No ADR contradicted. Owner approval of the visual/announced change is recorded in the plan.
- [ ] Artifact PR line `Artifact: updated (version <id>)`: added by the main agent, to confirm in the PR.

## Tests
- [x] `TZ=UTC yarn test --concurrency=1`: 52 files, 1202 tests green. `yarn lint` clean. `yarn check-locales` aligned. Worktree clean after restoring the sass file.
- [x] Assertions are behavioural (contrast ratios computed, dialog name, option name, computed outline in CT). The stylesheet-regex guard in `Filter.spec.tsx` is textual, justified because jsdom does not render SCSS.
- [x] Bite by neutralization (all restored, `git diff --exit-code` clean):
  - hover token set back to `neutral.tertiary` in `tokens.ts` (no rebuild): 1 red (token value test). The contrast spec reads the generated CSS, so it only goes red after `yarn build-theme` (the implementer recorded 4 red with rebuild). Acceptable, a minor coupling noted below.
  - `aria-labelledby={id}` removed from the popover: 5 red.
  - `:focus-visible` rule disabled in `index.scss`: 1 red (stylesheet guard); the CT keyboard-ring test would be the second, not run by me.
- [x] No test made redundant.

## Regressions
- [x] Other users of `.c__filter__button` (Filter, SearchFilter, UserSearchFilter) get the same hover colour and ring: intended. The `aria-label` replaces a hard-coded English `textValue="Loading"`, an improvement. Pointer-focus caveat: closing the popover by outside click restores focus to the trigger and `:focus-visible` can then show the ring; before, the native `auto` outline did the same. Not a regression.

## Findings
- minor — plan item (c) delivered partially: no `role="status"` / `aria-busy` on loading and empty rows. Verified plausible: React Aria's ListBox/ListBoxItem drop `aria-busy` and impose `role="option"`, children of an option are presentational, so a status role cannot live in the row. Delivered instead: loading row named via `aria-label` (locale key, 5 locales) and the previously unnamed dialog (`aria-dialog-name`) fixed. This is an honest, documented reduction, not a missing AC: the story ACs (AC1 to AC3) do not include it, and the announced name is the usable part. Condition: the PR description must state the reduction explicitly for the owner (a live-region announcement of loading is not provided; a future story could add a visually hidden `role=status` outside the listbox). Keep as minor.
- minor — `SearchFilter.tsx` empty row keeps `textValue="Empty"` (hard-coded English, not announced since the row is named by `emptyState` content). Pre-existing, unchanged; mention only.
- minor — contrast spec reads generated CSS, not `tokens.ts`: a token edit without `yarn build-theme` is caught only by the token-value test (1 red), not the contrast guard.

## Not verified
- No browser run by me: CT chromium (`e2e/filter`, `e2e/search-filter`) and the Storybook axe checks were not re-run; I rely on the implementer's recorded results (37 CT green, axe 0 violations in default/dark/dsfr-light). Gesture: open Storybook Filter `Open` and SearchFilter `Loading` in a light theme, Tab to the trigger (ring visible, 2px offset), hover it (label legible), click then Escape (no ring after pointer open), and run axe.
- Screen-reader output not heard: with VoiceOver, open the SearchFilter loading state and confirm "Loading…" is read and the dialog name is announced.
- `yarn build` not re-run.

## Verdict
Max severity: minor
Ship allowed: yes
