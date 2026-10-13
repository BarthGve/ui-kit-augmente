# Review — Ticket s30-empty/t01-empty-component

> Diff reviewed: `git diff next...feature/s30-empty/t01-empty-component`

## Plan compliance
- [x] Code does what the plan specifies, nothing more: all 7 tasks present (spec, tokens, component, scss, stories, mdx, changeset, registration). Only two extra SCSS rules, justified below.
- [x] Run interdicts respected: no new dependency or locale key; DataGrid and existing components/tokens/stories/hooks untouched (diff touches only `components/empty/*`, `cunningham.ts` registration, `index.ts`, `library.scss`, changeset, generated tokens); generated `cunningham-tokens.{css,scss,ts}` changed only by `yarn build-theme` output; no literal colour/spacing/radius in `index.scss`.

## Anti-hallucination
- [x] Imports verified: `Heading` from react-aria-components, `defaultTokenRefs` / `DefaultTokens` from ui-tokens, `Icon`, `Button`, `CunninghamProvider` all exist.
- [x] Values right: hand-added `empty` blocks in `cunningham-tokens-sass.scss` (6 themes) are byte-identical (md5) to the generated `cunningham-tokens.scss` blocks; the rest of the tracked sass file is untouched (a fresh build would have rewritten unrelated Modal/Tab lines; I restored it).
- [x] Code matches its claims (role only when named, no wrapper for absent slots).

## Security
- [x] No injection, authz, secrets, IDOR, XSS (React-escaped ReactNode slots), nor logs concerns: presentational component.

## Factorization
- [x] No duplicated rule. Contrast helpers copied from `timeline/Timeline.spec.tsx` are declared as known duplication (test-only; minor, see findings).
- [x] No speculative abstraction.

## Rules compliance
- [x] AGENTS.md: BEM `c__`, `clsx`, tokens in `tokens.ts` registered in `cunningham.ts`, `@use` in library.scss, value and type exports, changeset minor, RAC primitive, no locale text.
- [x] No ADR contradicted.
- [x] Design: tokens only; two literals (`3rem`, `28rem`) declared as design-system gap in tokens.ts, per plan. Extra SCSS rules: `.material-icons { font-size: inherit }` is needed because `Icon`/material-icons sets its own size (verified `.material-icons.icon--*` rules exist) and uses no literal; `img, svg { block-size: var(media-size); inline-size: auto }` uses the token only. Both justified.
- [x] No role by default: root gets `role="group"` only with aria-label/aria-labelledby (spec covers both + none).

## Tests
- [x] Suite run by me: `TZ=UTC yarn test --concurrency=1` green (3 tasks successful; Empty spec 42 tests pass). `git restore` of `cunningham-tokens-sass.scss` done afterwards.
- [x] Assertions pin AC1/AC2/AC3 (slot order and absence, h1-h6 and default, role, forwarding, keyboard Button, token emission x6 themes, stylesheet guards, contrast 18 cases).
- [x] Bite proven by neutralization, each restored (`git diff --exit-code` clean, status clean):
  - description-color in tokens.ts swapped for `surface.primary` → 6 tests red (one per theme), so the contrast guard bites despite reading tokens.ts (the token-emission test plus the build tie tokens.ts to the CSS);
  - `role="group"` forced → 1 red;
  - `level={3}` hard-coded → 5 red;
  - literal `#000` in index.scss → 2 red.
  Implementer's mutation evidence for the contrast guard is sufficient.
- [x] No test made redundant.

## Regressions
- [x] Additive only; no existing path touched.

## Findings
- minor — Empty.spec.tsx — contrast helpers duplicated from Timeline.spec.tsx (acknowledged in a comment); extract to a shared test util at the third use.
- minor — Empty.spec.tsx — contrast guard resolves colours from `tokens.ts` references, not from the final CSS value of `media-color` etc.; a hand-edited generated CSS would not be seen (the tokens-emission test only checks presence). Acceptable since generated files are not hand-edited.
- minor — Empty.mdx — API table column alignment is uneven (Prettier-only).

## Not verified
- No browser run: Storybook rendering, axe results in `default`/`dark`/`dsfr-light`, centring and wrapping of actions at narrow width, and the real look of `img`/`svg` media were not checked by me. Gesture: run `yarn storybook` on the worktree port, open Components/Empty (Default, HeadingLevels), switch themes and resize narrow.
- `yarn build`, `yarn lint`, `yarn check-locales` not re-run by me (only the test suite).
- Artifact update line is added later by the main agent (not a finding).

## Verdict
Max severity: minor
Ship allowed: yes
