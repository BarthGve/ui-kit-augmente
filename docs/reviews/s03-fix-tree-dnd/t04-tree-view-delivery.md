# Review s03-fix-tree-dnd / t04-tree-view-delivery

Branch verified: feature/s03-fix-tree-dnd/t04-tree-view-delivery. Diff `next...HEAD`: only docs/plans/s03-fix-tree-dnd.md (+14 -3), ticks and notes. No source touched.

## Checks run
- yarn lint, yarn check-locales, yarn test, yarn build: all green on my own run. The build rewrote `cunningham-tokens-sass.scss`; I restored it and `git diff --exit-code` is clean.
- Changeset `.changeset/tree-rows-hear-clicks.md` is present (on next via #51) and declares **minor**. This matches the launcher's request. The t03 note still says patch; the t04 note flags the discrepancy honestly.
- Artifact: t03 updated the TreeView page (1791557991-e7e1); t04 changes no component, so no new update is due.

## Judgment
1. Notes vs evidence: confirmed. `TreeViewExample` passes `canDrop={() => false}` (line 134). The `onClick` and `onKeyDown` handlers read `getElementsByClassName("name")?.[0].innerHTML` unguarded, so the `?.` is useless and it throws when no `.name` element exists. That read dates from commit 72b3abb4, before s03, so the defect is pre-existing. The notes are candid: task 4 is left unticked, no human hand drag is claimed, and the axe limits are stated.
2. Task 4 unticked: acceptable. The stories cannot show a successful in-tree move because of `canDrop` false (older than s03). The real-pointer e2e from t02 proves the move, and a drag attempt on the stories starts and is refused cleanly. Story deliverability is not blocked. This is a documentation and demo gap, not a defect in the diff. A human should still do task 4 by hand before release.
3. Pre-existing story defects: the Example handler throws on title, separator and view-more rows, and axe reports `aria-treeitem-name` (serious) in Example. s03 changed no markup, so the axe violation is very likely older, but I did not run axe on the pre-s03 commit (see "Not verified"). Both are out of the t04 scope. Severity is minor, and I recommend recording follow-ups rather than blocking: (a) guard the handler in the story; (b) fix the accessible name of the treeitem in Example; (c) optionally give the story a `canDrop` that allows moves so it demonstrates DnD.
4. Acceptance criteria: the notes and plan map AC1 to t01+t02, AC2 to t01+t02, AC3 to t01 (jsdom) and AC4 to t01+t02. I did not neutralize any invariant, because t04 changes no code; the tests were judged in the t01 to t03 reviews. I found no gap, but AC3 relies on jsdom alone.
5. Plan drift: none. Ticking 1 to 3 matches the evidence.

## Findings
- minor: pre-existing unguarded `innerHTML` read in the Example story handler (throws on non-name rows). Follow-up.
- minor: pre-existing axe `aria-treeitem-name` serious in Example (not confirmed pre-s03). Follow-up.
- minor: the stories cannot demonstrate a successful in-tree move (`canDrop` false); task 4 by hand is still open.
- minor: the t03 plan note says patch while the changeset is minor (the t04 note corrects it).

## Not verified
- No manual browser drag, and no Storybook run by me; I relied on the implementer's Playwright notes.
- axe was not re-run, and it was not run on the pre-s03 commit.
- Dark and white-label themes were not checked for interactions.
- The artifact version was not opened; I take the note at its word.
Human gesture: open the TreeView stories in Storybook, drag a row, click each row type, and run the axe panel on Example.

Max severity: minor
Ship allowed: yes
