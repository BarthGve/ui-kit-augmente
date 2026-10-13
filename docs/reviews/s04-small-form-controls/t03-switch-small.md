# Review — s04-small-form-controls / t03-switch-small

Branch verified: feature/s04-small-form-controls/t03-switch-small. Diff: `git diff next...HEAD` (14 files). The template templates/review-checklist.md is absent from this worktree; the checklist below follows the quality-bar axes.

## Checklist
- [x] Tests run by the reviewer: ui-tokens build, `yarn test --concurrency=1 --force`: 38 files, 619 tests green. Playwright CT `e2e/form-controls` (throwaway chromium headless shell config on the dm-port, deleted afterwards): 16 passed.
- [x] References verified: `Omit<InputHTMLAttributes, "size">`, `c__checkbox--small` (t01 shell), `c__switch--<side>`, `defaults.globals.spacings["4xs"]`, `--c--globals--spacings--xs` exist; tokens present in the generated css/scss/ts.
- [x] Plan vs diff, task 1 to 8: all present, no unrequested file. Default literals in the scss are untouched.
- [x] Tests: central invariants are behavioural (root classes, side, disabled, tokens in six blocks, real-browser dimensions). Neutralized `"c__checkbox--small": size === "small"` -> `true`: 1 Vitest red (the AC2 exact-class test); restored, `git diff --exit-code` clean. The plan notes further CT mutations (travel, footer indent, padding), not re-run by me.
- [x] Security: none applicable (style/prop change).
- [x] Factorization: small modifier and font shared with checkbox; switch only adds its own rail rules.
- [x] Design system: tokens only (`--c--components--forms-switch--small-*`), no literal colour/spacing in the new scss.
- [x] ADR/AGENTS: no new dependency; changeset present (minor); locales untouched.
- [x] Regressions: default rendering asserted unchanged (Vitest exact class + CT baseline 45x24, handle 18, offset 20).

## Findings
- minor: `size={n}` (numeric HTML attribute) is no longer accepted by `SwitchProps`. Intentional, documented in the changeset; a type-level breaking change under a minor bump.
- minor: the `forms-switch small tokens` test reads `cunningham-tokens.css` from disk with a split-based parser. Fragile, but it bites (6 red when a key is removed, per plan).
- minor / info: `cunningham-tokens-sass.scss` was hand-edited (owner delegation, known). The diff is only the 4 new keys per theme (plus the trailing comma on the preceding line). `yarn build` rewrites it; I restored it with git, tree clean.
- info: `Artifact: updated (version <id>)` is not in the PR description yet; the main agent adds it.

## Not verified
- Webkit and firefox (not run, chromium only).
- Storybook rendering, axe and the three-theme checks (declared by the implementer, not re-run). A human should open the `Switch` stories (`SizesCompared`, `SmallLabelRight`) in dark and dsfr-light.
- The artifact update and the PR description line.
- The other CT mutations in the execution notes, taken on the implementer's word.

Max severity: minor
Ship allowed: yes
