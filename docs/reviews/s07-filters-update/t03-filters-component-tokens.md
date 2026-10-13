# Review — Ticket s07-filters-update/t03-filters-component-tokens

> Diff reviewed: `git diff next...feature/s07-filters-update/t03-filters-component-tokens`

## Plan compliance
- [x] Code does what the t03 section specifies, nothing more (2 tokens.ts, registration in cunningham.ts, both index.scss rewritten, generated files, 2 specs + 2 CT specs, patch changeset).
- [x] Run interdicts respected: no new dependency, no new global token, no locale key, no existing token changed (diff of generated css/ts: only filter/search-filter lines), class names/selectors/nesting unchanged. Generated `cunningham-tokens.{css,scss,ts}` come from `yarn build-theme`, not hand-edited.

## Anti-hallucination
- [x] Imports verified: `DefaultTokens`, `defaultTokenRefs` from `@gouvfr-lasuite/ui-tokens` (same as sibling tokens.ts), `:/components/provider/Provider`.
- [x] Values: tokens equal the literals they replace (32/4/1/14/400/500/6/"0 6px 0 8px"/1.25rem/8px; 240/320/36/240/32/500/8/16).
- [x] The sass file: added lines of `cunningham-tokens-sass.scss` equal, sorted, the added lines of the generated `cunningham-tokens.scss` (diff SAME); 0 deletions; only `filter` and `search-filter` blocks (150 lines, same count as the generated scss).
- [x] Removal of the `var(--globals--…, fallback)` fallbacks in search-filter: the globals (`spacings.xxs/xs/4xs`, `font.sizes.sm`) exist, so computed values are unchanged (CT check records 6px, 0 8px).

## Security
- [x] No injection, authz, secret, IDOR, XSS, or logging surface (CSS and test-only `fs` reads).

## Factorization
- [x] One place for each value. The THEMES/read/stylesheet helpers are duplicated between Filter.spec and SearchFilter.spec (see minor).
- [x] No speculative abstraction.

## Rules compliance
- [x] AGENTS.md: `c__` BEM, `--c--components--<component>--<prop>` only, tokens in `tokens.ts` + `cunningham.ts`, `yarn build-theme`, changeset present. Registration order in cunningham.ts is alphabetical-ish by key (filter import placed before `forms/*`, fine).
- [x] No ADR contradicted.
- [x] Design: 3 extra tokens (`item-gap`, `popover-border-width`, `popover-radius`) are acceptable. They are literals of the same stylesheets (6px, 1px, 4px) not listed in the design doc; without them the "no literal" guard (AC1) could not hold. They add no visual change and no global token. Documented in tokens.ts and the plan; the design doc/artifact pages should list them (main agent, with the artifact line).
- [x] Artifact PR line: added later by the main agent (not a finding).

## Tests
- [x] Suite run by reviewer: `TZ=UTC yarn test --concurrency=1` 50 files, 1064 tests passed. The run rewrote `cunningham-tokens-sass.scss` (build-theme); restored with `git checkout`.
- [x] Assertions pin AC1: exact token values, keys emitted in all six theme blocks, stylesheet free of literals/fallbacks, every token read. CT computed-style specs pin the unchanged rendered values (not run by me, see Not verified).
- [x] Bite proven: put `height: 32px` back in `filter/index.scss` → 2 tests red (no-literal guard, reads-every-token); restored, `git diff --exit-code` clean.
- [x] No test made redundant.

## Regressions
- [x] None found: selectors and declaration order unchanged; contrast guard (t01) green in the suite. Token values inside the CSS are byte-equal to the former literals.

## Findings
- minor — Filter.spec.tsx / SearchFilter.spec.tsx — the `read`, `THEMES`, `themeBlock`, `stylesheet` helpers are copied in both files; acceptable for two uses, extract on a third.
- minor — Filter.spec.tsx — `it.each(THEMES)` relies on `:root ` with a trailing space matching the generated format; brittle if the generator formatting changes (fails loudly, not silently).
- minor — tokens.ts — weights/font size stay literals though globals exist (justified by identical computed values; hover/focus contrast STOP is the known t04 item).

## Not verified
- Playwright CT chromium (34 tests, computed styles before/after) not run by me; the "before" numbers recorded in the PR were not re-derived. Gesture: run `yarn test:ct` (or the repo's CT command) on `e2e/filter` and `e2e/search-filter`, and open the Filter/SearchFilter Storybook stories once in light and dark themes to eyeball the trigger and popover.
- `yarn build` and lint not re-run by me; custom themes (dsfr/anct) only checked textually (token presence in each theme block).

## Verdict
Token extraction is faithful, the hand-added sass blocks match the generated scss exactly, and the guard bites. Only minor findings.

Max severity: minor
Ship allowed: yes
