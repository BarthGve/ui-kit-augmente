# Review s02-fix-dropdown-menu / t02-menu-role-and-keyboard

Branch verified: `feature/s02-fix-dropdown-menu/t02-menu-role-and-keyboard`. Diff `next...HEAD`: DropdownMenu.tsx, DropdownMenu.spec.tsx, a changeset, plan ticks/notes.

## Run myself
- `yarn lint`: OK. `yarn check-locales`: OK. `yarn test`: 34 files, 551 tests green. `yarn build`: OK.
- `yarn build` regenerated `cunningham-tokens-sass.scss`; restored with `git checkout`.

## Plan vs diff
- Task 1 (isNonModal on root Popover, props kept): done. Task 2 (outside-click test): done. Task 3 (Tab limit documented in spec and ticket): done. Task 4 (e2e): reported run, see "Not verified".
- Public props/types unchanged, no new dependency (`useInteractOutside` comes from `react-aria`, already a dependency), no new locale key, class names kept. Run interdicts respected.

## Beyond the plan: useInteractOutside + exclusions
Justified: `isNonModal` removes the underlay and React Aria's outside-dismiss, so task 2 (click outside must still close) cannot pass without restoring it. The implementer found this by a red test. The trigger exclusion is needed: I read all consumers (HelpMenu, language-picker, FilePreview, ShareMembersActions, ShareLinkSettings, AccessRoleDropdown, FeedbackForm category menu). Every trigger does `setIsOpen(!isOpen)`, so without the exclusion the click would close and then reopen (double toggle). The spec's "closes on a click on the trigger" test covers that. ContextMenu and Filter do not use `DropdownMenu` (they use their own `Popover`), so they are untouched. Submenu exclusion (`data-trigger="SubmenuTrigger"`) covers portaled submenu popovers; covered by the submenu activation test. I found no consumer that breaks. Residual (minor): the predicate is shared with `shouldCloseOnInteractOutside` of the Popover, so a caller's predicate is now called after the two internal exclusions; semantically a superset, fine. Any open submenu counts as "inside" (comment states it).

## Mutations (restored, `git diff --exit-code` clean)
- Removed `isNonModal`: 2 red ("is not wrapped in a dialog", "lets Tab move focus out").
- Hook disabled (`isDisabled: true`): 1 red ("closes on a click outside the menu").
Both central invariants bite. The refusal test (`shouldCloseOnInteractOutside: () => false`) and the trigger test are not broken by those two mutations, as expected (they guard different clauses).

## Tab limit
Tab leaves the menu (focus moves out, test asserts it) but the menu is not asked to close because the portaled popover sends focus to the page end with no `relatedTarget`. The acceptance criterion "Tab leaves the menu" is about focus not being trapped; that is met. Plan task 3 explicitly allows documenting the limit. Not a major, but a visible leftover: a menu left open after Tab. Minor, and it should be flagged to the human and checked in a real browser (t04 Storybook keyboard pass).

## Non-modal side effects
The page is no longer `aria-hidden` and scroll is no longer blocked while the menu is open. This is inherent to the chosen fix (the plan's research/task chose `isNonModal`) and is consistent with a non-modal menu. It is mentioned in the code comment but not in the changeset or the spec; minor, worth one line in the PR description.

## Tests
No decorative assertions: roles, close behaviour, callbacks. `it` imported from `vitest` in the spec: t01 used `it.fails` which the global type lacks (broke `yarn build`); with `it.fails` flipped to plain `it` the import is no longer needed for that reason, but it is harmless and consistent. Minor nit only.

## Other
- Changeset present, `patch`, correct package. Trailer naming Opus is cosmetic.
- Artifact version 1791550341-decf: lives outside the repo, I could not open it; the PR description must carry `Artifact: updated (version 1791550341-decf)` (note: plan assigns the artifact update to t04, doing it here is early but compliant with the DoD for a component change).

## Not verified
- e2e (111 chromium tests, 4 HelpMenu "new tab" failures claimed identical on `next`): I did not run Playwright. Human gesture: run `yarn playwright test` on `next` and on this branch for help-menu, context-menu, filter, share-modal and compare failures.
- Real-browser Tab behaviour, focus return to the trigger on Escape, stacking with the FeedbackForm popover, WebKit/Firefox: only jsdom exercised. Gesture: open HelpMenu and the language picker in Storybook, press Tab, Escape, click outside, click trigger, and open the feedback category menu inside the feedback popover.
- Artifact content and version: not opened.

Max severity: minor
Ship allowed: yes
