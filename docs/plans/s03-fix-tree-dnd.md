---
validated: yes
---
# Plan — Story s03-fix-tree-dnd

Branch: `feature/s03-fix-tree-dnd` (framing) · tickets: `feature/s03-fix-tree-dnd/<ticket-id>`
Research: `docs/research/s03-fix-tree-dnd.md` — read it first; this plan does not repeat it.

## Target story
**As a** user organising items in a tree **I want** to move a node by drag and drop **so that** I can restructure my content. Complexity 3 in stories.md, 2 after research.
**The bug does not reproduce in jsdom and its documented cause (CSS `pointer-events`, ui-kit #213) was fixed by #215 in 0.25.0.** The story therefore becomes: pin the four behaviours with tests that do not exist today, check them with a real pointer in a browser, and fix what turns out red (known so far: `rowProps.onClick` ignored). Story note "reproduce the bug in a failing test first" cannot be met for the four criteria; it is met for the one real defect.
Acceptance criteria (docs/stories.md):
- AC1 Dragging a node onto a valid parent moves it, and `afterMove` is called with the new parent and index.
- AC2 Dropping onto a forbidden target (`canDrop` returns false) leaves the tree unchanged.
- AC3 Clicking a child item rendered through a portal does not trigger the click of its ancestors.
- AC4 The moves keep working after children are lazily loaded.

## Tickets (ordered)
### t01-tree-view-spec
- **size:** M
- **estimate:** 1.5d
- **depends on:** none
- **scope:** the missing Vitest spec (jsdom), written first; characterises AC1-AC4 and holds the one known red test.

Tasks:
1. [x] Create `packages/ui-components/src/components/tree-view/TreeView.spec.tsx` (Testing Library, `fireEvent` drag events, `getBoundingClientRect` mocked from the row `top` style and row height 34, `CunninghamProvider` + `TreeProvider` + `TreeView` with a minimal `renderNode` built on `TreeViewItem`). Import `it` from `vitest` (global type has no `.fails`).
2. [x] AC1 test (passes today): dragging `a` onto the middle of `b` calls `afterMove` once with `newParentId: "b"`, `sourceId: "a"`, `mode: "first-child"`, `index: 0`; the rendered tree shows `a` under `b`. Assert parent and shape only; the exact index inside a parent is not reliable in jsdom (research, traps).
3. [x] AC1 variant (passes today): `beforeMove` receives the result and a callback; `afterMove` is not called until the callback runs.
4. [x] AC2 test (passes today): with `canDrop={() => false}` the same drag calls neither `afterMove` nor `beforeMove` and the tree order is unchanged; also `canDrag` returning false prevents the move.
5. [x] AC3 test (passes today): a `createPortal`-rendered `<button>` inside a node, clicked, does not call an ancestor `div` `onClick`, nor the row `onClick`; a click on the node itself reaches the ancestor once (guards against a test that passes because nothing bubbles).
6. [x] AC4 test (passes today): `TreeProvider` with `onLoadChildren`, node `l` open and unloaded; after the children render, dragging `a` onto `l1`'s parent calls `afterMove` with `newParentId: "l"`.
7. [x] Known-red test, marked `it.fails` with `// fixed by t03`: `rowProps={{ onClick }}` is called once when an ordinary row is clicked (today `Row` drops it, `TreeView.tsx:342,399`). Keep AC3 asserting that the portal click calls it zero times.
8. [x] Run only this spec; record in the ticket which tests are green and which are `it.fails`, and anything jsdom cannot represent.

Notes (t01, done):
- Result: 6 green `it`, 1 `it.fails` (`rowProps.onClick`, `// fixed by t03`). Spec run alone and in `yarn test`.
- Index finding: jsdom drops `clientX/Y` from the generic `Event` it builds for drag events; the spec sets them with `Object.defineProperties`, and then the middle-of-row drop is exact (`first-child`, `newParentId: "b"`, `index: 0`), contrary to the research note. Only the index the plan names is asserted; positional indices (between rows) stay for t02.
- `canDrag` refusal: the HTML5 backend cancels `dragstart`; the drag helper stops there, as a browser would (firing `dragover` anyway throws "hover while not dragging"). The `canDrop`/`canDrag` negatives are meaningful because AC1 uses the same helper and moves.
- AC3: the bite is the ancestor `div` count (0 on the portal click, 1 on the label) plus `aria-selected` staying false. `rowProps.onClick` called 0 times is vacuous until t03 (Row never calls it today).
- jsdom cannot show: CSS `pointer-events`, hit-testing, the real HTML5 drag sequence, the drag preview, `dndRootElement` in a portal. Left to t02.

### t02-tree-view-browser-drag
- **size:** M
- **estimate:** 1.5d
- **depends on:** t01-tree-view-spec
- **scope:** answer research question 1 with a real pointer: a Playwright component test next to `e2e/`, since jsdom cannot see CSS `pointer-events` or the HTML5 backend.

Tasks:
1. [x] Add `packages/ui-components/e2e/tree-view/tree-view-dnd.spec.tsx` (and a small component fixture if the existing e2e pattern needs one) mounting a `TreeProvider` + `TreeView`, using `locator.dragTo` / mouse events; port from `bash .dm/lib/dm-port.sh`, not the dev port; chromium only.
2. [x] Test A: dragging a root node onto a parent with children moves it and `afterMove` fires with the expected `newParentId`; the node is rendered under the new parent.
3. [x] Test B: dropping onto a node refused by `canDrop` leaves the DOM order unchanged.
4. [x] Test C: the same drag works for a node whose children were loaded lazily (`onLoadChildren`).
5. [x] Test D: the tree rendered inside a portal / `Modal` with `dndRootElement` set to the modal element moves a node; without it, record what happens (research question 2; s18 depends on it).
6. [x] Any test red today is marked `test.fail()` with `// fixed by t03` and its cause written in the ticket. If A-C are all green, say that the story's DnD criteria were already met; if D is red, t03 decides the fix.
7. [x] Stop everything started (servers, browsers).

Notes (t02, done):
- Harness: fixture `e2e/helpers/mount-tree-view.tsx` (callbacks built in the browser, moves on `window.__treeMoves`, every `canDrop` parent on `window.__canDropAsked`). Run with a throwaway config (not committed): chromium only, installed headless shell 1243 (the configured 1228 is not installed), `ctPort` 28568 from `dm-port.sh`. Plain `locator.dragTo` drives the real HTML5 backend; no mouse fallback, no synthetic DataTransfer events.
- Result: **6/6 green, no `test.fail()`**, stable over `--repeat-each=5` (30/30). A (into a parent: `first-child`, `newParentId: "b"`, `index: 0`; and before the first root row: `newParentId: null`, `index: 0`, the positional index jsdom got wrong), B (`canDrop` asked about `b`, no move, order unchanged), C (lazy children) and D are green. **The story's DnD criteria were already met in a real browser (chromium)**: no defect reproduces, consistent with the #215 fix (not proven by reverting it). t03 reduces to the `rowProps.onClick` fix.
- D: the tree inside an open `Modal` moves a node both with `dndRootElement` = a `div` inside the modal body and without it. Removing the `dndRootElement` pass-through in `TreeView.tsx` turns 0 tests red: for a single tree in a same-document portal the prop is not load-bearing (window listeners see the events), and the pass-through itself has no test. Throwaway probe (not committed): a page tree mounted first plus a modal tree also move in the modal, both variants, no console error — but react-dnd 14 `DndProvider` (no `manager` prop, arborist passes none) shares one global manager per window built with the **first mounted** provider's options, so the modal tree's `dndRootElement` was most likely ignored there. For s18 (unverified, s18 decides): with several trees on a page only the first mounted tree's `dndRootElement` applies; a rooted tree mounted first, then a second tree, or unmount/remount ordering, was not exercised.
- Mutations (restored, `git diff --exit-code` clean): `canDrop` skipped in `disableDrop` -> 1 red (B); `onMove` no-op -> 5 red (A×2, C, D×2); `index === 0` branch disabled -> 2 red (A×2); `dndRootElement` dropped -> 0 red.
- Not verified: webkit/firefox, a headed OS-level drag (Playwright drives CDP drag events, hit-tested), the shared-manager ordering above, the drag preview, the stale `canDrop` highlight (research Q5), a shadow-root or iframe host.

### t03-fix-red-tests
- **size:** S
- **estimate:** 1d
- **depends on:** t02-tree-view-browser-drag
- **scope:** make the red tests green and nothing else.

Tasks:
1. [ ] `TreeView.tsx` `Row`: call the destructured `onClick` from `rowProps` in the ordinary-row branch before `props.node.handleClick(e)`, as the title/separator branch already does (`:380-381`). The t01 `it.fails` test flips to `it`; the AC3 portal test stays green (the item guard stops the event before the row).
2. [ ] For every `test.fail()` of t02, fix its cause in `components/tree-view/` or `components/dnd/` and flip it to `test`. Do not change the public props of `TreeView`, `TreeViewItem`, `TreeProvider`. If the cause is the HTML5 backend or `dndRootElement` (structural: expose `dndManager`, or change backend), stop and write `docs/decisions/005-tree-view-dnd-backend.md` (MADR, options and why rejected) before coding; otherwise no ADR.
3. [ ] If t02 found nothing besides task 1, state it in the ticket; do not invent changes.
4. [ ] Run the tree-view spec and the e2e `tree-view` spec; both green, no `it.fails` / `test.fail()` left.

### t04-tree-view-delivery
- **size:** XS
- **estimate:** 0.5d
- **depends on:** t03-fix-red-tests
- **scope:** regression, changeset, artifact.

Tasks:
1. [ ] Add `.changeset/<name>.md` for `@gouvfr-lasuite/ui-components`: **patch** (`rowProps.onClick` is now called, a bug fix with no API change); if t03 added a prop or changed a callback contract, **minor**.
2. [ ] Update the design-system artifact (`TreeView` page: `afterMove` / `TreeViewMoveResult` fields, `canDrop`, `rowProps.onClick`, `dndRootElement` note) — done by the main agent; the PR description carries `Artifact: updated (version <id>)`. Read the published index again before republishing and merge.
3. [ ] Run `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`; restore the regenerated `cunningham-tokens-sass.scss` if the build rewrites it.
4. [ ] Open the `TreeView` stories (Simple, SimpleWithChildren, Example, WithViewMore) in Storybook and drag by hand; stop the server (port from `dm-port.sh`).

## US totals
- **Person-days:** 4.5
- **Size mix:** 2×M, 1×S, 1×XS

## Run interdicts
- Do not change the public props or types of `TreeView`, `TreeViewItem`, `TreeProvider`, `TreeViewMoveResult`.
- `afterMove`, `beforeMove`, `canDrop`, `canDrag` keep their current contract; `newParentId: null` still means the root.
- No new dependency; no swap of `react-arborist` / `react-dnd` / `@dnd-kit` without ADR 005 (and an owner decision).
- Do not edit generated `src/cunningham-tokens.*`; no literal colour, spacing or radius; no `pointer-events` rule on tree-view classes.
- No change to `useTree.tsx` or the `canDrop` style flag unless a t02 test is red because of it.
- A ticket never merges with a red test: red targets are `it.fails` / `test.fail()` with `// fixed by tNN`.

## The point everything turns on
Whether a real pointer drag works today (t02). jsdom says yes; only a browser can confirm. If A-C are green, the story is test coverage plus a one-line fix and the "bug" was already fixed by #215; if not, t03 grows and the backend / `dndRootElement` choice (ADR 005) becomes the decision.

## Files touched
- t01: `components/tree-view/TreeView.spec.tsx` (new).
- t02: `e2e/tree-view/tree-view-dnd.spec.tsx` (new, plus a fixture if needed).
- t03: `components/tree-view/TreeView.tsx` (`Row`); possibly `TreeViewItem.tsx`, `components/dnd/*`; `docs/decisions/005-tree-view-dnd-backend.md` only if structural.
- t04: `.changeset/<name>.md` (new), the artifact (outside the repo).

## Test strategy
- Unit (Vitest + Testing Library, jsdom): callback shape, canDrop/canDrag, portal click guard, lazy loading; written first (t01). Index inside a parent is not asserted here.
- Component (Playwright, chromium): real pointer drags, indices, `dndRootElement` in a modal (t02).
- Manual: the four Storybook stories (t04).
- Prerequisite: dependencies installed (they are).

## Definition of Done
Single PR into `next` per ticket, structured description with `Artifact: updated (version <id>)` on the ticket that changes the component (t03/t04), readable diff, `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build` pass, review passed (no open critical or major), merged to `next`.
