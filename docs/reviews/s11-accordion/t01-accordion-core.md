# Review s11-accordion / t01-accordion-core

Branch verified: feature/s11-accordion/t01-accordion-core. Diff: `git diff next...HEAD` (16 files).

## Verification run
- `yarn workspace @gouvfr-lasuite/ui-tokens build`, `yarn test --concurrency=1`, `yarn lint`, `yarn check-locales`: all green (accordion spec: 15 tests pass).
- The build rewrote `cunningham-tokens-sass.scss` (unrelated lines); restored with `git checkout`, tree clean afterwards. The committed copy holds only the 84 accordion lines (owner delegation, noted).
- Imports and APIs checked: `Disclosure`, `DisclosureGroup`, `DisclosurePanel`, `Heading`, `Button` from react-aria-components; `Icon` from `:/components/icon`; `DefaultTokens` token paths used in `tokens.ts` resolve (the token CSS test and the build pass). Registration in `cunningham.ts`, `library.scss`, `index.ts` present.

## Plan vs diff (t01 tasks 1-8)
All tasks present; nothing outside scope (the plan.md diff only ticks tasks). Single changeset, minor, gitmoji line. Tokens: 12 keys, literals limited to the planned ones. No `useControllableState` (RAC owns state), as planned.

## Mutation proof
- `isDisabled={isDisabled}` on the item replaced by `undefined`: 1 test red (item disabled), restored, `git diff --exit-code` clean.
- Forced `allowsMultipleExpanded={false}` after the spread: 1 test red (multiple mode), restored, clean.
Central invariants (disabled propagation, open modes) bite. Controlled/uncontrolled behavior is covered by RAC and asserted end to end.

## Quality-bar axes
- Security: no input handling, no HTML injection; none.
- Factorization / maintainability: minimal wrapper over RAC, no dead code, no speculative abstraction. Small and readable.
- UI / design system: BEM `c__`, tokens only (`--c--components--accordion--*`, globals for transitions); forced-colors and reduced-motion handled; no off-system component. The scss spec (test j) is partly a stylesheet-regex test; acceptable as a literal-guard, not counted as decorative since it guards the "tokens only" rule.
- ADRs/AGENTS: respected (locales untouched, no new dependency).

## Findings
- minor: `Accordion.spec.tsx` emits React `act(...)` warnings on stderr (Enter/Space/focus tests, `trigger.focus()` outside act). Wrap `focus()` in `act` or use `user.tab()`.
- minor: the `blocks()` helper in the spec is somewhat heavy for the scss assertions; acceptable, could be simplified.
- minor: `AccordionItem` ignores extra div attributes (no `data-*` forwarding); matches the plan type, noted only.

## Not verified
- No rendered browser check by me: focus ring, chevron rotation, height animation (`--disclosure-panel-height`), the six themes, forced-colors. The implementer reports axe-core 0 violations on 6 stories x 3 themes; I did not rerun it. Human gesture: open Storybook Components/Accordion in default, dark, dsfr-light; Tab to a trigger, click, toggle and watch the animation; check the ring is not clipped.
- Arrow-key navigation is t02 (out of scope here).
- `yarn build` not rerun by me beyond the token build triggered by the tests.
- PR line `Artifact: updated (version <id>)` is to be added by the main agent after review: it is not in the diff and must be present in the PR description before merge.

Max severity: minor
Ship allowed: yes
