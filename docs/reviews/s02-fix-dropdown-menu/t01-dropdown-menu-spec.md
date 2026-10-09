# Review s02-fix-dropdown-menu / t01-dropdown-menu-spec

Branch verified: `feature/s02-fix-dropdown-menu/t01-dropdown-menu-spec`. Diff: new `DropdownMenu.spec.tsx` + plan ticks and notes. No source change.

## Facts run myself
- Spec: 13 passed (5 `it.fails` count as passed). `yarn lint` OK. `yarn test`: 34 files, 547 tests passed.
- `yarn test` regenerated `src/cunningham-tokens-sass.scss`; restored, `git diff --exit-code` clean.

## 1. Do the `it.fails` fail for the stated reason?
I removed `.fails` in a temporary copy: exactly 5 red, each for the right reason.
- dialog: `expected document not to contain element, found <div ...>` (a real dialog node).
- Tab: focus stays inside the menu (`expected true not to be true`).
- checked state: role is `menuitem`, not `menuitemradio/checkbox`.
- check icon: no `aria-hidden` on the svg.
- subText: no `menuitem` named `/Share.*Anyone with the link/` (the `aria-label` override hides it).
No bad query. Mutation: `isNonModal` added on the root Popover: the two t02 tests became "unexpectedly pass" (red), the other 11 stayed as before. So t02 must flip them, and the flip is enforced. Restored. The t03 ones flip only when t03 lands (the queries accept both radio and checkbox roles, which fits the plan).

## 2. Characterisation bite
- Dropped `onSelectValue` call and inverted `keepOpen`: 3 red.
- Removed `option.callback?.()`: 3 red.
- `isDisabled` forced false and `isHidden` ignored: 2 red (the two matching tests).
All restored, tree clean.

## 3. Vacuous assertions
None found. The `item()` helper is a deliberate role-agnostic query (`role^="menuitem"`), commented. Minor: `item("Locked")` for a disabled option relies on the label text, fine.

## 4. Plan deviations
Honest and recorded in the plan: `role="menu"` and Escape already pass (consistent with the research, which listed Escape as depending on the controlled `isOpen`, and left Tab untested). Research item "Tab could not be tested": jsdom does represent it, so no Playwright test, as the plan allowed. Both plain tests stay as useful regression guards. The harness owns `isOpen`, like consumers.

## 5. Other
- Commit trailer names "Claude Opus 5.5" instead of "Sonnet 5.5": cosmetic, minor.
- Design-system artifact: no UI or component change (test only), so no update required; not blocking.
- Security, factorization, ADRs (001, 002, 004): nothing contradicted. No new dependency.

## Findings
- minor: commit trailer model name mismatch.
- minor: the plan t02/t03 must remember to flip the five `it.fails` (the `// fixed by tNN` comments make it traceable).

## Not verified
- Real-browser Tab trapping and Escape (jsdom only); human: open the Storybook story, press Tab and Escape.
- Playwright e2e of the consumers not run (out of scope for t01).
- The a11y of the check icon in an actual screen reader.

Max severity: minor
Ship allowed: yes
