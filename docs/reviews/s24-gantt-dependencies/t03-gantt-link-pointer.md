# Review s24-gantt-dependencies / t03-gantt-link-pointer

Branch verified: `feature/s24-gantt-dependencies/t03-gantt-link-pointer`. Diff: `git diff next...HEAD` (19 files).

## Run myself
- `yarn workspace @gouvfr-lasuite/ui-tokens build`, then `yarn test --concurrency=1`: 43 files, 869 tests green.
- `yarn lint`, `yarn check-locales` (5 locales aligned), `yarn build`: green.
- CT `e2e/gantt` (throwaway chromium-headless-shell config, port 21772, deleted afterwards): 40/40 green, including the 5 new link tests (mouse create, cycle refusal, hit areas, click/Delete/Escape, touch).
- Token build regenerates `cunningham-tokens-sass.scss` with 24 more lines than the committed file (Modal `padding`/`close-button-size`, tab rgba values). The committed file differs from `next` by exactly 12 lines: `connector-border-color #5E5CD0` and `connector-background-color #FFFFFF`, 6 times each, nothing else. These are the same two values the generated `.scss` carries. The delegation holds. The file was restored with git.

## Verified, no finding
- API and references: `checkLink`, `MAX_LINKS`, `LinkRefusal`, `linkKey` exist in the t01 module; `Button` props (nano/tertiary/neutral/icon) are valid.
- `onDependencyChange` is called only in `endLink` (add) and `removeSelected` (remove), each once. Escape, `pointercancel`, `lostpointercapture`, blur and refusal go through `cancelLink` or the refusal branch with no call. `tasks` and `dependencies` are never written.
- Gating: `canLink = editable && !rtl && !!onDependencyChange`. The connector and the strips are rendered only then, and `touch-action: none` is on the connector (and on the handles under `[data-editable]`), not on the track.
- Refusals self/exists/limit/no_dates/cycle each have their own sentence, shown in the row's tip, with an `invalid-color` outline and a live-region announcement, in 5 locales. The sentence stays with no timer until a pointerdown, keydown or focusin.
- Listener cleanup (unlisten, scroll, lingering, selected) is covered by tests that bite (mutations below).
- Connector is 24px (`link-hit-size`); the end handle keeps its pixels (CT (m) green).

## Mutations (restored, `git diff --exit-code` clean after each)
| Mutation | Red tests |
|---|---|
| refusal branch in `endLink` disabled (link added anyway) | 8 |
| `canLink` without the `onDependencyChange` condition | 1 |
| `!session.current` guard removed from the connector pointerdown | 2 |
| `if (linkOf()) return cancelLink()` removed (Escape/cancel/blur/lost capture) | 5 |
| scroll `removeEventListener` removed from the link `unlisten` | 1 |
| unmount effect `session.current?.unlisten()` neutralised | 4 (1 link + 3 s23) |
| lingering-refusal document listeners not removed | 1 |
| selected-link `pointerdown` listener not removed | 1 |

Every central invariant bites. The tests are behavioural (payload, call count, live region, listeners), not decorative.

## Findings

### Minor
- m1. Link strokes paint over the row tooltip. The `__tip` lives in the row's stacking context, under the overlay's `z-index: 1`, so a link crossing a refusal sentence partly hides it. The sentence is also announced and the target gets an outline, so a refusal is not colour alone, and the sentence stays readable when no link crosses it. Advice: lift the tip above the overlay, or stack it in the overlay layer.
- m2. A 24px vertical hit strip crossing a third row takes the `pointerdown` that would have started a move or resize of that bar. For a bar narrower than 24px (month zoom) the pointer move/resize is impossible while the link is there. The keyboard path of s23 (Alt+arrows) still works and the effect exists only with link editing on, so I rate it minor. It is a real trade-off to record in the design and to revisit (a narrower strip, or letting bars win where a strip crosses one).
- m3. "!" flag overlaps Remove on a selected conflicting link, `link_conflict_tip` on a selected link not implemented (declared), Remove stays displayed when Tab moves the focus away (declared, no data effect). The s23 tooltip `side="start"` anchoring on short charts is pre-existing.
- m4. A connector is placed after the bar end. For a task ending on the last axis day the connector may fall outside the track and be unreachable by pointer; I did not measure it (see below).
- m5. `dragOf` now discriminates on `"edges"` (a field only the pointer drag has). It works, but it is implicit coupling between type and field. A `kind` tag on sessions would be clearer.
- m6. The PR must carry `Artifact: updated (version <id>)` (added by the main agent; not checked here). No changeset (t02's covers it) is acceptable.

No drift against the plan: all tasks (a)-(o) are present; extras (`link_refused_limit`, `LinkEditable` story) are justified and declared. The design file was updated for the strip placement.

## Could NOT verify
- Real touch on a device (only CDP-simulated touch), screen readers (live-region wording was checked only as DOM text), and axe/Storybook a11y: no run of mine, so the "axe" claims are the author's.
- Contrast pairs in the 6 themes: I relied on the passing unit contrast test, not on my own measurement.
- The connector for a task ending on the last axis day (m4), and a real pointer link drag during a keyboard edit session (the jsdom test covers the guard, I did not try it in a browser).
- Webkit and Firefox CT (only chromium headless shell). Human gestures: drag a connector in Safari/Firefox, scroll a long chart mid-drag, try link/Remove with a screen reader, in forced-colors and RTL.

Max severity: minor
Ship allowed: yes
