# Review s26-alert-modal / t02-alert-modal

Branch verified: feature/s26-alert-modal/t02-alert-modal. Diff: next...HEAD (9 files).

## Run myself
- alert-modal spec + modal specs: 52 passed. `yarn lint`: clean. `yarn check-locales`: aligned. `yarn test --concurrency=1`: 38 files, 604 tests passed.
- `yarn build`: green (served from Turbo cache, FULL TURBO); `cunningham-tokens-sass.scss` restored, `git status` clean. `git diff next` on modal/index.spec.tsx: empty. No locale file touched.

## Mutations (each restored, `git diff --exit-code` clean)
- remove `preventScroll`: 1 red. Swap/remove error focus rule: 1 red. Primary also calls onClose: 1 red. Details moved into the description node: 1 red. Drop `aria-hidden` on icon: 1 red. The invariants bite (each guarded by a single targeted test).

## Checks
1. AC1: role alertdialog, labelledby = title span, describedby = message div only (details is a sibling after it), no aria-label, icon aria-hidden. OK.
2. severity optional, no default, four values (type excludes neutral); media replaces icon; size default->MEDIUM, sm->SMALL. OK.
3. Focus by stable `useCallback` ref + `focus({preventScroll:true})`; primary else dismiss, dismiss for error. Ref is stable. Tab loop and focus return covered in spec (offsetWidth stub documented).
4. SCSS: only existing variables (`--padding`, `--c--globals--spacings--*`, `--c--components--modal--border-color`); no literal colour or radius; `transparent` keyword and `1px` border width are not colour/spacing literals (acceptable). Divider, right-aligned, `column-reverse` under sm present. `:has()` usage is fine for the supported browsers of this repo; none other flagged.
5. Labels reuse `disclaimer.ok` / `confirmation.cancel`; fr-FR cancel = "Annuler". OK.
6. Exports in index.ts incl. types; 11 stories; mdx; changeset minor. `src/cunningham.ts` gets a one-line `export *` of AlertModal, alongside the sibling modal re-exports: consistent, not a token file, no generated file in the diff.
7. Neutral primary gray-550 instead of mockup inverse: acceptable, honest design-system-gap handling (Button not restyled, no freestyle component), recorded in the plan.

## Findings
- minor: nothing tests that the initial focus is not re-applied on re-render (the stability of the callback ref, the stated fix guarantee). Inlining the arrow would pass the suite. Add a rerender test (type then rerender parent, focus stays where the user put it).
- minor: plan task 4 spec assertion ("five files carry keys") dropped; justified (check-locales + label tests cover it).
- minor: `iconFromType(severity as VariantType)` cast; harmless.

## Not verified
- Storybook / axe claims (11 stories x 3 themes, LongMessage opening on title, screenshots vs mockup): not re-run; relies on the implementer report. A human should open Storybook, view LongMessage, and the stacked layout at <= sm width, in dark and dsfr-light.
- Design-system artifact (AlertModal page 1791571303-a0f9, Composants entry, Modal page 1791570208-119f): cannot open it; the PR line `Artifact: updated (version 1791571303-a0f9)` is unchecked by me.
- Real browser Tab loop (jsdom needs the offsetWidth stub).

Max severity: minor
Ship allowed: yes
