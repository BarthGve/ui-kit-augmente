# Review s11-accordion / t02-accordion-keyboard

Branch verified: `feature/s11-accordion/t02-accordion-keyboard`. Diff: `git diff next...HEAD` (10 files).

## What I ran
- `yarn test --concurrency=1`: 646 passed, 1 failed: `data-grid/SimpleDataGrid.spec.tsx > sortable custom columns`. File untouched by the diff; passes 2/2 in isolation. Pre-existing load-dependent flake, not caused by this ticket. The 28 accordion tests pass.
- `yarn lint`: green. `yarn check-locales`: aligned.
- Playwright CT, chromium headless shell, throwaway config (port 23417: `.dm/lib/dm-port.sh` does not exist in this worktree), deleted afterwards: `e2e/accordion` 5/5 passed.
- `cunningham-tokens-sass.scss` was rewritten by the test run; restored with git. Tree clean apart from the report.

## Verifications
- Claim on generated tokens: confirmed. Only `cunningham-tokens.css` changes (6 lines, one per theme). `.scss` / `.ts` resolve `accordion.focus-ring-color` to `#5E5CD0`, which is the default-palette `content.semantic.brand.tertiary`; the old value `border.semantic.brand.primary` is also `#5E5CD0` there. They are consistent and unchanged. The dark themes live only in the `.css`.
- References checked: `DisclosureGroup` ref reaches the root div (proven by the real-browser arrow test); `ref={arrowKeys}` is a module-level function, so it is not detached and re-attached on every render; React 19 cleanup return is valid. `Input`, `TextArea` imports in the stories exist.
- Plan vs diff: tasks 1-5 present. Deviations are declared (native listener, ring token) and justified in the plan; design doc and Accordion.mdx token table are updated consistently. The plan's "consumer `onKeyDown` called first" is not delivered (RAC drops it, as in t01): declared and out of scope.
- Handler logic read: root ownership checked on the event target and on the collected triggers; `:not(:disabled)`; wrap, Home/End; `preventDefault` only when a move happens; events from inputs/textarea ignored (no trigger ancestor).

## Neutralization (restored, `git diff --exit-code` clean)
- Wrap removed on ArrowDown (`index + 1`): 2 red.
- Root-ownership check replaced by `false`: 2 red (nested test among them).
- `preventDefault` removed: 1 red (the defaultPrevented assertion).
- Ring contrast (h): plan mutations recorded as 6 red / 3 red; not re-run, the test reads the real css chains and passes at >= 4.70.

## Quality-bar axes
- Security: nothing relevant (no input to injection sinks, no dynamic HTML).
- Factorization: one handler, one selector constant. Contrast helpers duplicated from `button/focus-ring.spec.tsx` as the plan allows (known duplication, minor).
- Maintainability: small, commented, no dead code. Design-system: no new token, existing token repointed, no literal in scss.
- Tests: behavior-bearing and biting. CT tests that were green from t01 are labelled as regression guards in the file.

## Findings
- minor: the unit suite carries a flaky unrelated test (SimpleDataGrid) that can redden `yarn test` under load; not this ticket's scope.
- minor: `AccordionProps` still ignores `aria-label` and similar props (inherited from t01, noted for the owner).
- minor: a consumer `onKeyDown` on the root is silently dropped (RAC). Documented as a plan deviation; the mdx does not mention it.
- note: `Artifact: updated (version <id>)` is not verifiable from the branch; the main agent must add it to the PR description before merge.

## Could NOT verify
- Storybook rendering, a11y addon runs (8 stories x 3 themes) and the keyboard pass: claimed by the plan, not re-run. Gesture: open Nested and WithFormControls in dark and dsfr-light, press Tab then arrows.
- Webkit and firefox: browsers not installed; Safari does not Tab to buttons by default, so Tab-driven expectations are unproven there.
- Actual rendered ring colour in the dark themes (only computed from token chains): look at it once in the `dark` theme on a hovered, focused trigger.
- The published design-system artifact.

Max severity: minor
Ship allowed: yes
