# Review s05-horizontal-tabs / t01-tabs-contract-guard

Branch verified: feature/s05-horizontal-tabs/t01-tabs-contract-guard. Diff: Tabs.spec.tsx (new, 382 lines), e2e/tabs/tabs.spec.tsx (+62), Tabs.mdx (+3), plan ticks.

## Premise (research): verified true
Commit 3b5e9d4e ("add accessible variants and controlled selection") is an ancestor of next and last touched Tabs.tsx on next. `variant: "default" | "line"`, `fullWidth` and `keyboardActivation` already exist. The story is correctly reduced to a guard ticket. Tabs.tsx, index.scss, types.ts and cunningham-tokens* are untouched in the diff (empty `git diff --stat` on them).

## Checks run
- Tabs unit spec: 28/28 green.
- Full suite: 917 to 922 of 923 per run. The failing set differs on every run (Gantt, DatePicker, Calendar, provider, Select, Modal, share utils), under machine load average 21. None involve Tabs; none are caused by this diff (known flaky class). Not reproducible as a stable failure.
- lint OK, check-locales OK, build OK (cunningham-tokens-sass.scss rewritten by the build, restored with git).
- CT e2e/tabs on chromium headless shell (throwaway config, port 21772, deleted): 28/28.
- Claim "toMatchInlineSnapshot unusable": verified with a throwaway spec (deleted): "The snapshot state ... is not found". Two vitest copies exist (root and package, both 3.1.2). Claim true.

## Mutations (all restored, `git diff --exit-code` clean)
Unit: keyboardActivation default set to manual: 2 red. Indicator rendered for default instead of line: 3 red. overlay--primary changed to overlay--secondary: 7 red. neutral--tertiary changed: 1 red. focus outline-offset 2px to 0: 1 red. full-width class renamed: 1 red.
CT (playwright/.cache cleared each time): list overflow-x visible: 4 red. List padding 0: 2 red. tab shrink (flex 0 1, min-width 0, overflow hidden): 4 red. Root min-width:0 / max-width:100% removed: 0 red.
Note: two first CT attempts used GNU-only sed and were no-ops (28 green); redone with perl and bite.

## Findings
- minor: AC3 in a flex row (root min-width:0 / max-width:100%) is not protected; the CT helper wrapper caps the width. The decision is declared and the test name ("keeps a narrow viewport free of horizontal page scroll") claims only what it measures (page scroll, list scrolls, ring, last tab reachable), so no overclaim. Follow-up: a CT inside a flex parent.
- minor: the story AC says "snapshot test"; an exact literal DOM string via toBe is an honest equivalent (same regression detection, forced by repo tooling) but not a literal snapshot. Declared in the plan. Acceptable.
- minor: the stylesheet tests assert exact declarations and tokens; some (padding values) are close to change detectors, but they are the contract the AC asks to freeze ("variants unchanged"), and mutations bite.
- minor: contrast helpers duplicated from button/focus-ring.spec.tsx (declared, known).
- Contrast test reads token names from index.scss, covers 6 themes, composites overlay; disabled-text exemption documented in a comment. No token fails.
- Keyboard tests cover both variants, automatic (implicit and explicit) and manual with Enter and Space separately, disabled skip, wrap, Home/End.
- 320px CT polls the last-tab position (expect.poll); the ring and scrollWidth checks are one-shot but occur after the awaited tab count and focus. Acceptable.
- Docs sentence in Tabs.mdx is the only user-visible change; the Artifact line "not applicable (tests and docs only, no component change)" is consistent. No changeset: acceptable (no published output changes).
- No leftover throwaway files (pw.rev.config.ts, test-results, zz.spec removed). No ADR contradicted.

## Not verified
- Firefox/WebKit CT (chromium only). Gesture: run `yarn test:ct` on all projects.
- Storybook rendering of Default/Line/Overflow stories not opened. Gesture: view them at 320px.
- Full suite never green in one run on this loaded machine; flaky specs differ per run. Gesture: rerun `yarn test --concurrency=1` on an idle machine.
- AC1 "new horizontal appearance": relies on the research claim that #231 is already the shipped default/line; no design pixel comparison made.

Max severity: minor
Ship allowed: yes
