# Review s24-gantt-dependencies / t05-gantt-dependencies-demo

Branch verified: `feature/s24-gantt-dependencies/t05-gantt-dependencies-demo`. Diff: `git diff next...HEAD` (7 files).

## Run myself
- `yarn test --concurrency=1`: 895 ui-components tests green (44 files), 21 tokens, 12 codemod. `yarn lint`: 0 errors. `yarn check-locales`: aligned. `tsc --noEmit`: clean.
- `yarn build`: green (turbo served 2 of 3 tasks from cache; I inspected the resulting `dist`). No file in `dist` contains `DEMO_`, "Design the service" or "Write the brief"; `src/index.ts` does not export `demo`. No `package.json` / `yarn.lock` / `cunningham-tokens*` change versus `next` (the sass file the build rewrites was restored with git; tree clean).
- CT `e2e/gantt` (throwaway chromium-headless-shell config, port 23777 from dm-port, deleted afterwards, no process left): 47 tests; full runs 3 of 3 green, then 4 more full runs: 3 had a single red, always the s23 test "end handle ... 24px by the row height" (`Expected >= 24, Received 0`). New demo CT green every run.
- Flake characterisation: the same test alone, 6 runs, 0 red. Full run excluding the new demo test (`--grep-invert`), 6 runs: 1 red, the same test. So it exists without this ticket's test. The failing line is a one-shot `expect(await hittable(end, "x"))` right after mount (no polling), in a test this diff does not touch (introduced by s23, commit 9ddb6015); the new tests use `expect.poll(hittable)`. The diff only adds a `DemoGantt` export and a tiny `demo.ts` import to the shared helper; `EditableGantt` is unchanged. Verdict: pre-existing, not aggravated by evidence (rate not proven identical on `next`, which I did not run). Minor, out of scope.

## Mutations (restored, `git diff --exit-code` clean)
- `ui` start moved off the design end (no conflict left): 1 red (`has a link already in conflict`).
- Link `launch -> retro` replaced by `launch -> brief` (loop in data): 2 red (chain, loop/refusal).
(Author's other mutations of demo.ts not repeated.)

## Plan vs diff
- Task 1-5 present and ticked. `demo.ts` deterministic (fixed `DEMO_TODAY`, clock test imports the module under two system times). Data: 10 tasks / 9 links, chain brief-design-api-integrate-test-launch-retro (>= 5), diamond design/api/ui/integrate, conflict design->ui (same-day), undated `training` (link to launch listed, not drawn), cycle pair integrate->brief refused. All links pass `normalizeLinks`.
- Declared deviation (c) accepted: literal "last task 21 days before axis end" is impossible because `buildScale` ends the axis with the week of the latest end; encoding with a one-day latest milestone and every other task >= 21 days before the end, six week-start locales, is the reasonable reading and is tested.
- `LinkEditable` now reads initial links from `args.dependencies` (same three links, same behaviour): small, justified (one render shared by two stories), no regression.
- `DemoGantt` helper has its own reducer (like `EditableGantt`): the CT proves the shared data, not the story reducer; the story reducer is the pre-existing `LinkEditable` one. Accepted, honestly stated.
- Test quality: `demo.spec.ts` asserts invariants through `links.ts` (not decorative); the CT scenario drives the real pointer (move, resize, link, refused loop with tip and status text, unlink) and asserts payloads. Runs under jsdom (setup file requirement), fine.
- No changeset: acceptable (nothing published changes; `demo.ts` not bundled).

## Gantt.mdx truthfulness
Checked against code and `locales/en-US.json`: props table and `GanttDependencyChange` contract match `types.ts`; the five refusal sentences match the locale keys exactly; the conflict rule, `MAX_LINKS` 1000, the five-names-then-"+n" rule (`slice(0,5)`), Delete/Backspace removal, Alt+Shift chord table match the code; the 14 new tokens (link-color, link-selected-color, link-conflict-color, link-casing-color, link-flag-background-color, link-flag-color, connector-border-color, connector-background-color, link-width, link-width--selected, link-gutter, link-lead, link-arrow-size, link-hit-size) match `tokens.ts` one for one with the same defaults. Hand-check recipe: payload strings in steps 1, 2, 3, 5, 6 equal what the CT asserts and what the story's `<output>` prints (`id: start to end`, `kind from to`); step 4 loop is real (brief->design->api->integrate), step 6 picks "Design the service" as the nearest dated row below. "Later versions" rewritten.

## Findings
- minor 1: s23 end-handle test flaky (non-polled `hittable` right after mount), pre-existing; suggest `expect.poll` in a later cleanup ticket.
- minor 2: date chip crossed by link strokes during a drag (t03 m1 class): presentation, not part of AC6; out of scope here, carry as known.
- minor 3: no `range` prop: not required by any s24 AC; `Later versions` says the axis does not grow while dragging, which is why the demo needs the slack milestone. Accepted.
- minor 4: the MDX calls it a "Remove link button" while its visible form is not described (accessible name "Remove link from X to Y"); wording only.
- Cold-start Docs page Vite module error: not reproduced by me (no Storybook run); dev-server optimisation noise, not attributable to this diff.

## AC check across t01-t05
AC1-AC5 (drawing, conflicts, cycle refusal, link/unlink pointer and keyboard, a11y text) are covered by the earlier ticket reviews and still green in the full CT run (47) and unit run (895). AC6: the `Dependencies` story loads `demo.ts` and lets the user move, resize, link, unlink; the documented recipe matches the code and a CT proves the same data end to end. Met.

## Not verified
- Storybook was not launched by me: the rendered Docs page, the `Dependencies` story by hand, axe in default/dark/dsfr-light (author reports 51 runs, 0 violations: unconfirmed by me). Gesture: open Storybook, run the 7-step recipe once with a mouse, once keyboard, check Docs page cold start.
- Screen readers, forced-colors on a real OS, touch device, WebKit/Firefox CT (config limited to chromium headless shell). Windows Alt+Shift layout switch.
- `next`'s flake rate for the s23 test.
- PR line `Artifact: updated (version <id>)`: added by the main agent, not checked here.

Max severity: minor
Ship allowed: yes
