# Review s03-fix-tree-dnd / t01-tree-view-spec

Branch verified: `feature/s03-fix-tree-dnd/t01-tree-view-spec`. Diff `next...HEAD`: new `TreeView.spec.tsx` + plan ticks and notes. No source change, no changeset (as planned).

## Verified myself
- Spec alone: 7 passed (6 `it`, 1 `it.fails` reported as pass).
- `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`: all exit 0. The build rewrote `cunningham-tokens-sass.scss`; restored, `git diff --exit-code` clean.
- Imports/APIs: `createEvent`, `fireEvent`, `TreeProvider` props (`initialTreeData`, `onLoadChildren`), `TreeView` props (`canDrop`, `canDrag`, `beforeMove`, `afterMove`, `rowProps`, `initialOpenState`), `TreeViewItem` `testId` all exist (TreeView.tsx, TreeViewItem.tsx).

## Plan vs diff
All 8 tasks of t01 are done and ticked; nothing extra. AC1 (move + beforeMove deferral), AC2 (canDrop, canDrag), AC3 (portal click), AC4 (lazy-loaded parent) each have a test; the `it.fails` is marked `// fixed by t03`.

## Mutation proof (each restored, `git diff --exit-code` clean at the end)
| Mutation | Red tests |
|---|---|
| `canDrop` result ignored (`TreeView.tsx` ~236) | 1 (canDrop refusal) |
| Portal guard `if (!isItem)` -> `if (false)` (`TreeViewItem.tsx`) | 1 (portal click) |
| `afterMove?.(moveResult)` removed | 3 (AC1, beforeMove deferral, lazy) |
| `canDrag` ignored | 1 (canDrag refusal) |
| `onClick?.(e)` added in ordinary `Row` branch (the t03 fix) | 1: the `it.fails` test, which now passes and so fails as `it.fails`; AC3 stays green |

Every central invariant bites. The `it.fails` fails today for the stated reason (`Row` ordinary branch uses `onClick={props.node.handleClick}`, so `rowProps.onClick` is dropped) and flips exactly when the fix lands: it is not failing for an unrelated reason.

## Specific checks
1. Every test can fail: shown above (all 7, including the `it.fails` one).
2. `it.fails`: confirmed (M5).
3. Vacuity: `expect(onRowClick).not.toHaveBeenCalled()` in AC3 is indeed empty until t03, as the notes admit. The AC3 test remains meaningful through the ancestor counter (0 on the portal click, 1 on the label witness) and `aria-selected`; mutation M2 proves it. After t03 the row assertion becomes real. Minor, honestly disclosed.
4. Drag helper: `defineProperties` of `clientX/clientY` compensates for a documented jsdom limit (generic Event without those fields) and does not hide product behaviour. Stopping when `dragstart` is cancelled mirrors a browser; the canDrag negative is meaningful because the same helper moves a node in AC1 (M4 goes red). The `getBoundingClientRect` mock is derived from the row `top` style, with the middle-of-row point giving `first-child`.
5. Plan notes are honest: green/it.fails counts match, jsdom limits listed, and the correction to the research note on the index (exact in this setup) is stated openly.
6. Premise: the bug does not reproduce in jsdom. Test-first with a red reproduction only holds for `rowProps.onClick`. This is acceptable given the research (the real question needs a real pointer, t02) and the plan explicitly frames t01 as characterisation plus one known-red test.

## Findings
- minor: AC3 `expect(onRowClick).not.toHaveBeenCalled()` is vacuous until t03 (disclosed). No action needed now.
- minor: tests assert `shape()` order and `aria-level` (DOM structure) in several places, but these are the observable result of a move, not decorative.
- cosmetic: the commit trailer names Opus 5.5 instead of Sonnet 5.5.

## Not verified / for a human
- A real pointer HTML5 drag, CSS `pointer-events`, hit-testing, the drag preview and `dndRootElement` in a portal cannot be seen in jsdom: left to t02 (Playwright) and the manual Storybook drag in t04.
- Positional indices (between rows) are not asserted.

## UI / artifact
No component or UI change in this ticket (test only), so no design-system artifact update is required here; it is scheduled in t04.

Max severity: minor
Ship allowed: yes
