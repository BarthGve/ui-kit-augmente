# Review — s04-small-form-controls / t02-radio-small

Branch `feature/s04-small-form-controls/t02-radio-small` (verified), diff `next...HEAD`, judged against the t02 section of the plan, the design contract, the research, AC1-AC4 and the t01 review (patterns already accepted).

## Verified myself
- Radio Vitest spec: 19/19. `tsc --noEmit`: clean. `yarn lint`: green. `yarn check-locales`: aligned.
- `yarn test --concurrency=1`: 38 files, 609 tests green.
- `yarn build`: green; it rewrote `cunningham-tokens-sass.scss` (known drift), restored with `git checkout`, tree clean.
- Playwright CT, chromium (headless shell 1243, throwaway config on dm-port 20070, cache cleared): `e2e/form-controls/` 11/11 (6 checkbox + 5 radio). Config and cache deleted, nothing listening on 20070. I never touched port 6006.

## Check list
1. No generated/token file: `git diff --stat next...HEAD -- '*cunningham-tokens*' cunningham.ts radio/tokens.ts` is empty. No `forms-radio` variable; the radio reads `forms-checkbox--small-size` / `small-font-size` (t01 tokens). The Vitest test guards both the css and `radioTokens() == {}`. OK.
2. Default unchanged: `_index.scss` change is a purely additive block inserted before `&.c__checkbox--disabled`; no existing rule edited. Baseline CT green: input 24x24, label 34x34, dot 16px. Vitest checks the default class list is exactly `c__checkbox c__radio`. OK.
3. Mutations (each restored, `git diff --exit-code` clean at the end):
   - small class always `true`: Vitest 1 red (19 total), CT 1 red (default 24px baseline).
   - dot rule removed (`::before` not reduced): CT 1 red (2/3 dot test).
   - box rule removed (`input` not resized): CT 1 red (16px box test).
   - label padding `$padding: 0` (shared checkbox SCSS): CT 2 red (default 34px baseline, small >= 24px).
   - `size` forwarded to `<input>`: not run at runtime; guarded by `tsc` only (same trade-off accepted in t01, `size` is destructured out of `props`).
   Note: my first B/C runs gave stale results because the CT cache was not cleared; I redid them with `playwright/.cache` removed before each run.
4. Hit area: small box 16px + 4px padding + 1px border per side = 26x26 >= 24 (CT asserts >= 24, click at (2,2) selects). Keyboard: Tab enters the group, ArrowDown moves focus and selection, label shows the brand border (CT green). The "disabled skipped" case is only in the implementer's Storybook claim, not in a committed test (minor, native behaviour).
5. Group text indent: see finding below.
6. Test 1(c) removed: justified as in t01 (React drops a non-numeric `size`, the runtime test could never go red); replaced by `@ts-expect-error` on `size="huge"` and `size={3}`, compiled by `tsc --noEmit`. `BrandProbe` extracted in `mount-form-controls.tsx` from the t01 inline span, used by both helpers: a reasonable factorization (the checkbox spec still passes). It is declared after its use as a `const`, which is fine at runtime (used inside a component body called later).
7. Changeset: `minor`, `✨(Radio) add small size`, states the `size` type narrowing and that `size={n}` no longer compiles. Same minor-vs-major semver trade-off as t01 (package is post-1.0); owner decision, already documented.
8. Artifact: I cannot open it. The Radio page update and version `1791571877-b911` are unverified by me. The PR must carry the exact line `Artifact: updated (version 1791571877-b911)`; a human must open the published index and confirm the Radio page, the `Composants` entry and `canvas.json`.

## Plan vs diff
Tasks 1-7 present and ticked; execution notes added. Nothing outside the plan (stories, mdx, changeset, helper, spec). No hard-coded colour/spacing/radius; only tokens and the 2/3 calc, as the design states. Six stories match the plan.

## Findings
- minor: RadioGroup (and CheckboxGroup since t01) text, error and success lines keep the default group footer indent (2rem) while small radios sit about 8px closer to their labels, so the group text looks slightly misaligned under small radios. Decision: minor / follow-up, not major. AC3 requires that each small control keeps its label, hint text, error and success states. They are kept (Vitest asserts group text, error and success classes with small radios; the individual `Radio` hint indent follows the control width via the shared shell rule). The group text belongs to the group, not to a control, and the design explicitly does not give `RadioGroup` a size (group-level default deferred). It is cosmetic, not a loss of function. Suggest a follow-up ticket or an owner decision on a group-level indent.
- minor: "disabled radio skipped by the keyboard" is not covered by a committed test (native behaviour, checked in Storybook by the implementer).
- minor: type narrowing shipped as `minor` (see t01).
- minor: `cunningham-tokens-sass.scss` drift on every `yarn build`, pre-existing.

## Could NOT verify
- The design-system artifact content and version (no access): open it.
- Storybook rendering, axe and the three themes (default, dark, dsfr-light): not re-run; the implementer's 0-violation claim is unchecked. Human gesture: open the six Small stories in each theme, Tab/arrow through `SmallGroup`, look at the group text alignment.
- Only chromium; webkit and firefox never run.
- 16px / 10.67px visual conformity to Figma (pending, stated in the design).

Max severity: minor
Ship allowed: yes
