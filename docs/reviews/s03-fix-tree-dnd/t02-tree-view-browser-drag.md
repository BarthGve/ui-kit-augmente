# Review s03-fix-tree-dnd / t02-tree-view-browser-drag

Branch verified: `feature/s03-fix-tree-dnd/t02-tree-view-browser-drag`. Diff `next...HEAD`: `e2e/helpers/mount-tree-view.tsx` (new), `e2e/tree-view/tree-view-dnd.spec.tsx` (new), plan ticks and notes. No component source change, no changeset (test-only: consistent with the plan).

## Run myself
- `yarn lint` OK, `yarn check-locales` OK, `yarn test` 559/559 OK, `yarn build` OK (it regenerated `src/cunningham-tokens-sass.scss`; restored, tree clean).
- E2E, chromium only, throwaway config (headless shell 1243 via `executablePath`, `ctPort` 22900 from `dm-port.sh`): 6/6, then `--repeat-each=3` = 18/18, no flake. Config and output deleted, nothing listening on 22900.

## Mutations (each restored, `git diff --exit-code` clean)
- `canDrop` ignored in `disableDrop`: 1 red (B).
- `index === 0` branch disabled: 2 red (both A tests).
- `onMove` result forced to null (no-op): 5 red (A x2, C, D x2). Only B stays green, as expected.
- `dndRootElement` pass-through removed: 0 red.

Tests A-D use a real `locator.dragTo` (HTML5 backend, hit-tested) and can fail.

## Plan vs diff
All 7 t02 tasks done and ticked; fixture justified by the plan ("small component fixture"). No `test.fail()` needed since nothing is red. Nothing outside the plan. Helper follows the repo pattern (`e2e/helpers/mount-*.tsx`, exported `TestX`), no debug leftovers; the `window.__*` globals are typed and documented in the file header (CT function props are one-way, so the justification holds).

## Findings
- minor: test D's name says "(dndRootElement with-root)" but the prop is not load-bearing (0 red when removed). D guards "a tree in a Modal can drag", not the prop. The implementer discloses this honestly in the plan notes, and the comment in the fixture explains the react-dnd single-backend caveat. Suggest renaming or adding a one-line comment in the spec so the test name does not suggest a `dndRootElement` guard. Not a gap against the AC list (no AC requires the prop to be guarded); s18 must test it itself.
- minor: the `shape` helper and the `canDropAsked` poll are fine; B's `moves` check right after the poll is not polled, but it is preceded by a positive wait (`canDrop` asked about `b`), so it is acceptable.

## Premise ("DnD criteria already met")
Supported by the evidence for chromium: A (into a parent and before the first root row, indices exact), B, C and D move or refuse as expected with a real pointer, and mutations prove the assertions bite. Caveats stated by the author and agreed: "fixed by #215" is not proven by reverting it; webkit/firefox, OS-level drag, the shared react-dnd manager ordering and the stale `canDrop` highlight were not exercised. AC1-AC2 (move + callback, canDrop refusal) and lazy children are covered by a test that can fail; AC3 (portal click) is covered in jsdom by t01; AC4 follows the t03 fix. No uncovered DnD criterion found.

## Other axes
Security: n/a (tests). Factorization/maintainability: fixture small and single-use per scenario flags; no speculative abstraction. Design system: n/a (test-only, no component added or changed), so no artifact update is owed on this ticket. Commit trailer naming "Opus 5.5" is cosmetic.

## Not verified
- webkit and firefox (the repo config has them; only chromium run, as the plan says).
- A headed, OS-level human drag; the drag preview; the Storybook stories (t04).
- `dndRootElement` effectiveness with several trees on a page (author's hypothesis, unverified).
- Human gesture: drag a node in the Storybook `TreeView` stories, and in a real Modal with two trees.

Max severity: minor
Ship allowed: yes
