# Review — s04-small-form-controls / t01-checkbox-small

Branch `feature/s04-small-form-controls/t01-checkbox-small` (HEAD d7f119a8), diff `next...HEAD`, judged against the t01 section of the plan, the design contract, the research and AC1-AC4.

## Verified myself
- Checkbox Vitest spec: 25/25 green. `tsc --noEmit`: clean. `yarn lint`: green. `yarn check-locales`: aligned.
- `yarn test --concurrency=1`: 36 files, 585 tests green.
- Plain `yarn test`: **reproduces** here (1 failed file, `card/Card.spec.tsx`, "Failed to resolve entry for package @gouvfr-lasuite/ui-tokens", 569 tests passed). It **also reproduces on `next`** (base dir, same failure, same file). Cause: the ui-tokens `test` script starts with `yarn build` and rebuilds `dist` while ui-components imports it. This is a pre-existing environment race, unrelated to this diff (no ui-tokens or Card change). Advice: separate ticket (turbo `dependsOn` on build, or a `--concurrency=1` test script).
- `yarn build`: green. It rewrites `cunningham-tokens-sass.scss`; restored with `git checkout`, `git diff --exit-code` clean. (The same rewrite on `next` brings 24+/12- of unrelated drift, which justifies the hand edit below.)
- Playwright CT, chromium (headless shell 1243, throwaway config on port 22975, cache cleared): 6/6 green. Config and cache deleted, nothing listening.

## Generated files (1)
- `cunningham-tokens.css`: +12, only the two variables in the six theme blocks.
- `cunningham-tokens.scss`: +/- 24/12 lines, reformatting of the `forms-checkbox` map line for the two keys (the `-` lines are the `'size': 1.5rem` line gaining a comma).
- `cunningham-tokens.ts`: single minified line. Removing `,"small-size":"1rem","small-font-size":"0.75rem"` from the new file gives the `next` file byte for byte: only the two keys.
- `cunningham-tokens-sass.scss` (hand-edited): the 6 `-` lines are `'size': 1.5rem` rewritten as `'size': 1.5rem,` followed by `small-size` and `small-font-size`; nothing unrelated. It departs from "never edit generated files" but is documented in the plan, owner-delegated, and avoids committing real drift. Minor: a resync ticket of this file is advisable (as in s10).

## Plan vs diff
Tasks 1-8 present. The diff contains nothing beyond the plan (plan file ticks and execution notes are expected). Task 1(c) removed as a runtime test: justified. React drops a non-numeric `size` on `<input>`, so such a test could never go red. The invariant lives in `tsc` (the `@ts-expect-error` lines, compiled by `tsc --noEmit`, which passes; the `size={3}` one would be reported as unused if `size` stayed numeric). Forwarding is structurally impossible because `size` is destructured out of `props`; forwarding `size={size}` to the input is a type error.

## Behaviour and tests (3)
- No default rule edited in `_index.scss`: the `&--small` block is purely additive, last in the block (so it wins by order). Only tokens (`small-size`, `small-font-size`, `--globals--spacings--xs`) are used, no literal colour, spacing or radius. Default rendering unchanged (AC2): baseline CT 24x24 / 34x34 green.
- Mutations (each restored, `git diff --exit-code` clean at the end):
  1. root class forced to `true` (small always): Vitest 1 red (25 total), CT 1 red.
  2. small-size width rule replaced by a literal `24px` in `_index.scss`: CT 2 red (16px box test, marks fit test).
  3. label padding `$padding: 0` (shrinks the hit area): CT 2 red (default 34px baseline and small >= 24px).
  4. forwarding `size` to `<input>`: no runtime test (by design, see above); only the `tsc` guard applies. With a cast it compiles, so this guard is only as good as the types. Acceptable.
  5. token removal from `tokens.ts`: not run; the spec reads the generated css from disk, so it guards the generated file, not `tokens.ts`. Normal, as in `focus-ring.spec`.
- Tests are behavioural (dimensions, click on padding, keyboard and focus colour, hint indent); no decorative ones. The Vitest class test (`c__checkbox--small`) is a class contract but it is the shared modifier t02/t03 depend on, and is backed by real dimensions in CT. OK.

## Semver of the type narrowing (2)
`CheckboxProps` drops the numeric HTML `size`. Callers passing `size={n}` stop compiling; it was meaningless on a checkbox and invisible at runtime. It is documented in the changeset text. Package is 1.3.0 (post-1.0), so strictly a TS breaking change is a major; labelling it `minor` is a defensible but real choice. Minor severity: the owner should decide between keeping `minor` (practical, near-zero real impact; no in-repo caller passes `size` to Checkbox) or `major` at the next release. No in-repo usage found.

## Hit area and dimensions (5)
Small box 16px + label padding 4px + 1px border per side = 26px >= 24 (CT: label >= 24x24 green, click at (2,2) toggles). The token comment states the >= 14px rule (14 + 10 = 24). 16px/12px are design proposals pending Figma: acceptable, stated in the design.

## Artifact (6)
I cannot open the artifact. The plan, the instructions and the PR line announce `Artifact: updated (version 1791569518-80e1)` (Checkbox page: prop `size`, tokens `small-*`, note). Unverified by me; a human must open the published index and confirm the Checkbox page, the `Composants` entry and `canvas.json`, and the PR must carry the exact line (`/dm-review` rule).

## Stories and docs (7)
Seven stories (`Small`, `SmallWithLabel`, `SmallIndeterminate`, `SmallError`, `SmallSuccess`, `SmallDisabled`, `SizesCompared`) match the plan; mdx documents `size` and both tokens (tab-formatted table rows, cosmetic). The implementer's Storybook axe run (21 passes) is a claim: I did not re-run Storybook.

## Findings
- minor: `cunningham-tokens-sass.scss` hand-edited; a resync ticket is advisable.
- minor: type narrowing shipped as `minor`; owner to decide minor vs major (documented).
- minor: `yarn test` parallel race (ui-tokens rebuild vs Card spec), pre-existing on `next`; out of scope, separate ticket.
- minor (cosmetic): mdx table rows mix tabs and spaces.

## Could NOT verify
- The design-system artifact content and its version id (no access): open it.
- Storybook rendering, axe and the three themes (default, dark, dsfr-light): not re-run. Human gesture: open Checkbox stories in each theme, Tab through, check focus ring and contrast.
- Only chromium; webkit and firefox never run (Safari rendering of the 16px native-appearance-less input and the SVG overlay).
- Visual conformity of 16px / 12px to Figma (pending).
- Radio and Switch not yet consuming the shell modifier (t02/t03).

Max severity: minor
Ship allowed: yes
