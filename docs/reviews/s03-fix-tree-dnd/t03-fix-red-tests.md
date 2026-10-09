# Review s03-fix-tree-dnd / t03-fix-red-tests

Branch `feature/s03-fix-tree-dnd/t03-fix-red-tests` (verified). Diff `next...HEAD`: `TreeView.tsx` (Row), `TreeView.spec.tsx`, `.changeset/tree-rows-hear-clicks.md`, plan ticks/notes. Matches the expected scope; nothing extra.

## Run myself
- Tree-view spec: 7/7 green.
- `yarn lint`, `yarn check-locales` ("aligned"), `yarn test`: green. `yarn build` green; `cunningham-tokens-sass.scss` was regenerated and restored, `git status` clean.
- e2e `tree-view` in chromium (throwaway config, headless shell 1243, `ctPort` 22829 from `dm-port.sh`): all 6 pass (the output was compressed; I saw tests 1 to 6 passing, no failure). Config deleted, nothing listening on the port.
- No `it.fails` / `test.fail` left in `src` or `e2e`.

## Findings by check
1. **Row change.** The ordinary-row branch now calls `onClick?.(e)` then `props.node.handleClick(e)`. This is identical to the title/separator/see-more branch, which was already like that. `onClick` stays destructured out of `restCustomRowProps`, so the spread cannot override it or fire it twice. Each row type goes through exactly one branch, so there is no double fire. The portal guard in `TreeViewItem` (`closest(".c__tree-view--node")` then `stopPropagation`) is untouched and runs before the row.
   Mutations, each restored (`git diff --exit-code` clean):
   - Fix removed: 1 red (the new test).
   - `onClick` called twice: 1 red (the new test, `toHaveBeenCalledTimes(1)`).
   - Portal guard neutralised: 1 red (AC3 portal test).
   Independence of the `rowProps.onClick` assertion: I also removed the `onAncestorClick` assertion alongside the guard mutation. The test is still red on `expect(onRowClick).not.toHaveBeenCalled()` ("spy called 1 times"). So the row assertion is now meaningful on its own, no longer vacuous as in t01. Remaining weak spot: the order "onClick before handleClick" is not asserted (the new test checks both effects, not their order). Minor.
2. **Consumer impact (`stories/tree-view-example.tsx`).** Confirmed: its `onClick` reads `getElementsByClassName("name")?.[0].innerHTML`. The `?.` is on the collection (never nullish), so `[0].innerHTML` throws a TypeError when no `.name` exists. `tree-view-item-example.tsx` renders `.name` for ordinary nodes and renders nothing for TITLE/SEPARATOR. So the throw is pre-existing on title/separator rows (the old title branch already called `onClick`). For ordinary rows `.name` exists, so no new throw. Clicks on the arrow or the actions are stopped before the row. Not worse for ordinary rows. This is a story file, not shipped code. Minor, out of scope; can be a follow-up.
3. **Changeset patch vs minor.** The text is accurate and honest: a handler that was ignored now fires, including on Enter/Space (the row `click()`s itself). It is a bug fix with no API or type change, matches the plan (t04 task 1: patch unless a callback contract changed) and the repo's gitmoji `🐛` convention. For consumers, a previously dead handler becoming live is observable, so minor is defensible, but I do not block on it. Minor, owner's call; patch kept.
4. **Artifact.** `Artifact: updated (version 1791557991-e7e1)` cannot be checked from the repo or from here (outside the repo, no access to the published index). The PR description must carry that exact line. See "Not verified".
5. **ADR.** ADR 005 is not needed: no structural change, no backend or `dndRootElement` change, t02 left no `test.fail()`. Consistent with the plan. No contradiction with accepted ADRs.

Plan vs diff: tasks 1 to 4 all done; public props untouched; no `useTree`, no `pointer-events`, no dependency, no literal style value.

## Tests
The new test asserts behaviour (exactly one call, row selected), not DOM or labels. It bites on 2 mutations. No decorative tests added.

## Not verified
- The design-system artifact page and version id (outside the repo). Human gesture: open the artifact, check the TreeView page lists `rowProps.onClick` as now called on ordinary rows, and put the version id in the PR.
- Real-browser feel in Storybook (Example story: click and Enter on a row, check the displayed text; click on a title row to see the pre-existing throw). Not run.
- webkit/firefox: e2e ran in chromium only.
- Whether other consumers outside this repo rely on `rowProps.onClick` being ignored on ordinary rows.

## Verdict
No critical, no major. Minors: order of `onClick`/`handleClick` not asserted; pre-existing unguarded `.name[0]` in the story; patch vs minor is a judgement call.

Max severity: minor
Ship allowed: yes
