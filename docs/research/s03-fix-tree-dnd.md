# Research — Story s03-fix-tree-dnd

Worktree `.worktrees/s03-fix-tree-dnd`, branch `feature/s03-fix-tree-dnd` (from `next` at `9faf575e`). Dependencies are installed. A throwaway Vitest spec (jsdom, `fireEvent.dragStart/dragEnter/dragOver/drop`, `getBoundingClientRect` mocked from the row `top` style) was written, run and deleted; nothing was committed from it. **No real browser was driven** (no Storybook, no Playwright run).

## PREMISE CHECK — read this first
**The headline bug does not reproduce, and its documented cause is already fixed in this fork.**
- ui-kit #213 ("Tree UI-Kit DND broken") blames a CSS `pointer-events` rule introduced by ui-kit PR #126 that blocked interaction with children. `packages/ui-components/CHANGELOG.md:146` (0.25.0) lists "remove pointer-events rules breaking drag-and-drop #215". The fork is at 1.3.0 and `grep pointer-events` finds nothing in `components/tree-view/` or `components/dnd/`. Premise "DnD is broken today" is **false as far as the code shows**.
- In jsdom, with the current code: dragging a node onto a parent calls `afterMove` (see AC1), `canDrop: () => false` leaves everything untouched (AC2), a click inside a portal does not reach ancestors (AC3), and a move into children loaded lazily works (AC4). jsdom cannot see CSS `pointer-events`, hit-testing or the HTML5 drag backend's real events, so this proves the logic, not the browser. Whether a real pointer drag works is **unverified**.
- The one real defect found is outside the four criteria: `rowProps.onClick` is never called (fact 4).
- Upstream #72 ("Click on tree item children through portals triggers click") has an empty body; behaviour is already guarded (AC3).

## The five structuring facts
1. **DnD is `react-arborist` 3.4.3, which itself uses `react-dnd` 14 + `react-dnd-html5-backend`** (`node_modules/react-arborist/package.json:41-42`). The backend is hard-wired to `HTML5Backend` in `react-arborist/dist/module/components/provider.js:47` with `options: { rootElement: api.props.dndRootElement || undefined }`. The only knob is the `dndRootElement` prop (passed by `TreeView.tsx` to `<Tree>`); a custom `dndManager` prop exists on arborist but is not exposed by `TreeView`. `@dnd-kit` (`components/dnd/Draggable.tsx`, `Droppable.tsx`) is a **different, second** DnD system, used only so tree rows can be *external* drop targets (`TreeViewItem.tsx` wraps each node in `Droppable`; the Storybook example drags folders from a side panel with a `DndContext`). The story's "drag-and-drop library's backend" trap is the HTML5 backend, not dnd-kit.
2. **`afterMove` receives a `TreeViewMoveResult`, not nodes** (`types.ts`): `{ targetModeId, mode (first-child|last-child|left|right), oldParentId?, index, newParentId: string|null, sourceId }`, built by `getMovePosition` (`TreeView.tsx:73-162`) and called from `onMove` (`TreeView.tsx:164-181`) after `context.treeData.handleMove(result)` (`useTree.tsx`, `move(sourceId, newParentId, index)` of react-stately). `beforeMove(result, moveCallback)` can defer both. `newParentId` is `null` for the root (not the `rootNodeId`), while `oldParentId` defaults to `rootNodeId` (`TreeView.tsx:99`): an asymmetry the criterion "new parent and index" must account for. Observed: dropping `a` in the middle of `b` gives `{mode:"first-child", newParentId:"b", index:0, oldParentId:"ROOT"}`.
3. **`canDrop` is wired through `disableDrop` and has side effects** (`TreeView.tsx:222-318`). `canDrop(...)` false returns `true` (drop disabled) and **mutates** `parentNode.data.value.canDrop = false`; later branches mutate it back to `true`. That field drives the `canDrop` CSS class (`TreeViewItem.tsx`) so the highlight is stale-able. Other forbidden targets are hard-coded: title/separator/view-more parents, the root between certain separators/titles, an unloaded closed parent. Observed: `canDrop: () => false` => `afterMove` not called, tree unchanged.
4. **`rowProps.onClick` is dropped for ordinary rows** (`TreeView.tsx` `Row`, destructure at `:342`, ordinary branch `onClick={props.node.handleClick}` at `:399`, title/separator branch calls it at `:380-381`): `const { onKeyDown, onClick, ...restCustomRowProps }` then the ordinary `<div>` uses `onClick={props.node.handleClick}` and never calls `onClick`. Only title/separator/view-more rows call it. Confirmed by test: clicking a normal row calls `itemProps`/`onClick` of `TreeViewItem` once but `rowProps.onClick` zero times. The Storybook example (`stories/tree-view-example.tsx`, "Display node …") relies on it. CHANGELOG 347 ("Add props to customize row") says this prop is public.
5. **Click-through-portal (#72) is guarded in `TreeViewItem`, by `closest`** (`TreeViewItem.tsx`, node `onClick`/`onKeyDown`): if `e.target.closest(".c__tree-view--node")` is null, `stopPropagation()`. React synthetic events bubble through the React tree across portals, so a portal child (a dropdown menu, a modal) has a DOM target outside the node and is stopped. Observed: a click on a portalled `<button>` rendered inside a node reached neither the row, nor the item `onClick`, nor an ancestor `div` (0/0/0); a normal click reached the ancestor (1). Side effect: the stop also hides portal clicks from the consumer's own ancestors, by design, and `itemProps` is spread **after** the handlers (`{...itemProps}`) so a consumer `onClick` in `itemProps` replaces the guard.

## Target story
**As a** user organising items in a tree **I want** to move a node by drag and drop **so that** I can restructure my content. Complexity 3. Acceptance criteria (docs/stories.md):
- Dragging a node onto a valid parent moves it, and `afterMove` is called with the new parent and index.
- Dropping onto a forbidden target (`canDrop` returns false) leaves the tree unchanged.
- Clicking a child item rendered through a portal does not trigger the click of its ancestors.
- The moves keep working after children are lazily loaded.

Upstream: ui-kit #213 (above), related #72. Story s18 (move modal) depends on this one (stories.md:320-323).

## Current state of the code
- `components/tree-view/`: `TreeView.tsx` (wrapper of arborist `Tree`, `Row`, `getMovePosition`, `onMove`, `disableDrop`, `disableDrag` from `canDrag`), `TreeViewItem.tsx` (node renderer base: arrow, lazy-load `useEffect` calling `handleLoadChildren` when open and not loaded, auto-open after 500ms hover while dragging, `Droppable` wrapper, click/keydown guards), `useTree.tsx` (`useTreeData` from react-stately + `handleMove`, `handleLoadChildren`, `updateNode`, ref-fixing `useEffect`), `providers/TreeContext.tsx` (`TreeProvider`, `useTreeContext`, `treeApiRef`), `types.ts`, `utils.tsx`, `index.scss` (no `pointer-events`), `TreeViewSeparator.tsx` (cursor).
- `components/dnd/`: `Draggable.tsx` (`useDraggable`), `Droppable.tsx` (`useDroppable` + `onOver`); both `@dnd-kit/core` 6.3.1. `Droppable` works without a `DndContext` (the throwaway test mounted none).
- Stories only: `tree-view/stories/{tree.stories,tree-view-example,tree-view-item-example,data}.ts(x)`; the example uses `DndContext` + sensors for external drops.

## Anchor points
- Move computation: `TreeView.tsx` `getMovePosition`, `onMove`, `disableDrop`.
- Applying the move: `useTree.tsx` `handleMove` / `moveNode`.
- Lazy loading: `useTree.tsx` `handleLoadChildren` / `updateNode`; `TreeViewItem.tsx` load effect.
- Click guard: `TreeViewItem.tsx` node `onClick`; row forwarding: `TreeView.tsx` `Row`.
- Backend: `dndRootElement` prop on `TreeView` (`TreeView.tsx` props) -> arborist `provider.js:47`.

## Verified APIs / functions
- `TreeView<T>(props: TreeViewProps<T>)`: `initialOpenState`, `dndRootElement?: HTMLElement | null`, `selectedNodeId`, `rootNodeId` (required), `canDrop?({parentNode, dragNodes, index})`, `canDrag?(node)`, `beforeMove?(result, moveCallback)`, `afterMove?(result)`, `renderNode`, `paddingTop/Bottom`, `rowProps`.
- `TreeProvider<T>` props: `initialTreeData`, `initialNodeId`, `onRefresh(id)`, `onLoadChildren(id, page) => Promise<{children?, pagination?}>`.
- `TreeViewMoveResult`, `TreeViewMoveModeEnum`, `TreeViewNodeTypeEnum` in `types.ts`; `useTree` returns `handleMove`, `handleLoadChildren`, `updateNode`, `addChild`...
- arborist DnD: `useDropHook` calls `tree.props.onMove({dragIds, parentId (null for root), index, dragNodes, parentNode})` then `tree.open(parentId)` (`dnd/drop-hook.js`); `computeDrop` decides parent/index from pointer offset in the row (`dnd/compute-drop.js`).

## Traps & constraints
- **Tests today: none.** No `*.spec.tsx` for tree-view, no `e2e/tree-view/`; `grep` shows only stories reference the component. Consumers inside the repo: none (only stories). Real consumers are downstream apps (Docs), unreachable here.
- **Test technique (what worked):** jsdom needs `getBoundingClientRect` mocked from the row's `style.top` and the row height 34 (`rowHeight={34}`, `paddingTop` 10) for react-virtual-style positioning, and DragEvents via `fireEvent`. `clientX/clientY` on jsdom DragEvents are not reliably honoured, so the **drop index within a parent is not reliable** in jsdom (a drag of the last node "above" the first returned `index 1, mode right` instead of `0, first-child`); the parent and callback shape are. Index precision belongs in a real browser (Playwright component tests already exist in `e2e/`, chromium only works per s02).
- `getBoundingClientRect` mock prints `NaN is an invalid value for the left css style property` from arborist's cursor; harmless.
- `disableDrop` reads `parentNode.data.value.childrenCount`; the `hasChildrenLoaded ?? true` line cannot fall back (the operands are `0`/`false`, not nullish), a latent oddity, not shown to break a criterion.
- `TreeView` queries `document.querySelector(".c__tree-view")` (first tree in the page) to measure height: **two trees on one page share it**. Two trees rendered together did not throw; the height wiring was not tested.
- `Row` ignores `rowProps.onClick` (fact 4); `itemProps` can override the click guard (fact 5).
- Do not edit `cunningham-tokens.*`; any new style goes through tokens (AGENTS.md).
- `.changeset/config.json` has `baseBranch: "main"`; changesets present on `next`: `calm-buttons-focus.md`, `checked-menus-speak.md`, `quiet-menus-leave.md`.

## Open questions
1. **Does a real pointer drag work in a browser today?** Unanswered here. A Playwright component test (HTML5 DnD: `locator.dragTo`) is the only way; if it passes, the story's DnD criteria are already met and the story reduces to non-regression tests plus the `rowProps.onClick` fix. If it fails, the cause (CSS in an *app* stylesheet, `dndRootElement` inside a modal/shadow root, the `.c__dnd--droppable` wrapper intercepting events) is not in this repo's tree-view SCSS.
2. Was ui-kit #213 reported against a consumer where `dndRootElement` was needed (tree inside a portal/modal: arborist then binds the backend to `window`, outside the modal)? Plausible, not reproduced; s18 (modal in a portal) is the exact case.
3. Should the `rowProps.onClick` fix be in this story? It is a real bug in the same files and affects the example, but it is not one of the four criteria. Proposed in scope (small), owner to confirm.
4. AC1 says "new parent and index": confirm that `{newParentId, index}` of `TreeViewMoveResult` (with `newParentId: null` meaning root) is the intended contract, rather than the node objects.
5. Does the `canDrop` stale-flag (fact 3) produce a visible wrong highlight in a browser? Not checked.

## Real complexity
Scored **3** in docs/stories.md; real: **2**. The bug as described is already fixed and the four behaviours hold in jsdom, so the work is writing the missing tests (none exist), one real-browser drag check, and the small `rowProps.onClick` fix. It rises to 3-4 only if the browser check (question 1) shows a real failure in the backend/`dndRootElement` wiring, and then it needs an ADR on the backend choice.

## Split proposal
Not needed (verdict < 5).
