# Review — s24-gantt-dependencies / t02-gantt-links-draw

Branch verified: `feature/s24-gantt-dependencies/t02-gantt-links-draw`. Diff: `git diff next...HEAD` (22 files).

## What I ran
- `yarn workspace @gouvfr-lasuite/ui-tokens build`, then `yarn test --concurrency=1`: 43 files, 836 tests green. The run rewrote `cunningham-tokens-sass.scss`; restored with `git checkout`.
- `yarn lint`: green. `yarn check-locales`: aligned. `yarn build`: not run separately (the test pipeline's turbo tasks were green). Nothing in the diff suggests a build break.
- CT `e2e/gantt` (chromium-headless-shell, throwaway config on the dm-port, deleted): run 3 times. 35/35, 34/35 and 35/35. The one failure is s23's "end handle ... 24px" test (hit-test of a handle, no `dependencies` in that test). It passed alone twice, so I judge it flaky and unrelated to the diff.
- Tree is clean (`git status`: nothing, throwaway config and `playwright/.cache` removed).

## Verification of the declared points
- Tokens: the hand-added hunks in `cunningham-tokens-sass.scss` are identical, line for line, to those of the generated `cunningham-tokens.scss` (diff of the +/- lines: identical). Both are +78/-6, only gantt tokens (12 x 6 themes) and the `handle-grip-width` trailing comma. `cunningham-tokens.ts` is the one-line generated file.
- No invented API: `routeOf`, `conflictsOf`, `normalizeLinks`, `neighboursOf`, `linkKey`, `Position` all exist (t01 / scale). `Intl.ListFormat` local typing is acceptable. `fill` is a justified local workaround (provider untouched).
- Bounds: a link whose end has no `positionOf` (dateless, outside the MAX_DAYS window) is skipped in `GanttLinks` (`!pred || !succ`), and it is still listed. MAX_LINKS comes from `normalizeLinks` (tested). DOM is bounded: at most 1000 links x <= ~5 segments + flag.
- Read-only/no-dependencies: `links.length === 0` gives `shown`/`linkState`/`linkTexts` null, no overlay, no list, no scroll listener (test + mutation, below).
- Scroll listener passive, rAF-throttled, removed and frame cancelled on unmount (mutated, below). Overlay `aria-hidden`, pointer-events none; per-row `aria-describedby` appended to the s23 instructions id; hidden list. No caller data mutated (`shown` copies).
- Colour is never the only conflict cue: dashed + "!" chip + text in the row description/list. Forced-colors and reduced-motion rules exist. Contrast pairs: taken from the plan/design numbers; I did not recompute them.

## Mutations (all restored, `git status` clean)
| Mutation | Red |
|---|---|
| fresh-conflict filter removed (`!heard.has` -> `true`) | 1 jsdom |
| `heardConflicts` never remembered | 1 jsdom |
| RTL guard removed (`!rtl`) | 1 jsdom |
| preview override ignored (`preview?.id === task.id` -> false) | 2 jsdom |
| `removeEventListener` dropped | 1 jsdom |
| listener registered without dependencies | 1 jsdom |
| `fill` made a no-op | 1 jsdom |
| `aria-hidden` removed from overlay (sloppy sed, also hit other nodes) | 4 jsdom (incl. the overlay test) |
| clip-path scroll term removed | 1 CT (task column paint) |
| `--gantt-pitch` without border-width | 4 CT |
| arrow/segment end geometry altered | 5 CT |
| overlay `z-index: 1 -> -1` | 8 CT |
| `display:none` on overlay | 10 CT |
| **`fresh = preview ? ... : []` guard replaced by `true`** | **0 red** |

Trap met on the way: Playwright CT caches the built bundle in `playwright/.cache` (gitignored); my first three CSS mutations passed because of it. Redone after clearing the cache each time (results above).

## Findings

### minor 1 — the `preview ?` gate of the conflict announcement is untested
Replacing it with `true` leaves all 101 jsdom tests green. Effect: without the gate, a conflict present in the data at mount (or arriving through a new `dependencies` prop) would be announced as if the user had caused it. The product intent ("a NEW conflict only, created by a session") is stated in the code but not protected. Add a test: an editable Gantt mounted with a conflicting pair, nothing dragged, live region empty.

### minor 2 — reverse pair reads "Conflict with: Build, Build"
A->B and B->A are both in conflict; `clashes` pushes the counterpart once per link, so `row_conflict` names the same task twice. Declared by the author; dedupe the names (a `Set`) when you next touch it.

### minor 3 — links painted over the keyboard focus ring (unverified)
Overlay `z-index: 1` sits above rows; the ring is a row `::after` (`z-index: 2` inside the row's own context), so link lines crossing a focused row will be drawn over the ring. Cosmetic, thin lines, ring remains readable. I could not check it by eye; a screenshot of a focused row with a link crossing it should be added to the PR.

### minor 4 — scroll clip is one frame late on fast scroll
Inherent to the rAF throttle; the only risk is a one-frame sliver of a link over the sticky column. Accepted, documented by the test name. A CT frame-by-frame check was not done.

### minor 5 — plan drift on the clip, documented
Plan said `inset(0 0 0 scroll)`; the diff opens the right side by gutter + width so a U route leaving the last day is not cut. Justified and covered by a CT test; the plan text should be amended for t03/t04 readers.

### minor 6 — memo optimisation untested; size of hand-added sass
`GanttLink` memo on primitives (re-render only for the dragged task's links) has no test. Performance only. No action required.

No critical or major found: the central invariants (overlay never over the sticky column, endpoints within 1px at day/week/month and 20px root font, no listener/overlay without links, live announcement only on new conflicts during a session, listener cleanup, `fill`) are each bitten by at least one test.

## Could NOT verify
- Contrast ratios in the six themes (taken from the design/plan figures), forced-colors on a real OS, reduced-motion in a real browser, screen reader output (VoiceOver/NVDA) of the row descriptions and the live region. Gesture: open the `WithDependencies` story in dark and dsfr-light, enable Windows high-contrast / macOS "increase contrast", and Tab through rows with VoiceOver.
- Firefox/WebKit (CT run on chromium only). Gesture: open the story in Safari and Firefox, scroll horizontally and check the clip at the column edge.
- Visual look of the ring/link crossing (finding 3) and of the 20px "!" chip against the bar (declared deviation from 16px): eyeball it in Storybook.
- `yarn build` as a separate command; the Artifact line (`Artifact: updated (version <id>)`) is added by the main agent: noted only.
- The s23 "24px handle" CT test flaked once under load; SimpleDataGrid.spec was green this time.

Max severity: minor
Ship allowed: yes
