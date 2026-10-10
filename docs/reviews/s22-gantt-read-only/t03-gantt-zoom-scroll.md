# Review s22-gantt-read-only / t03-gantt-zoom-scroll

Branch verified: `feature/s22-gantt-read-only/t03-gantt-zoom-scroll`. Diff: `git diff next...HEAD` (16 files).

## Run myself
- `yarn workspace @gouvfr-lasuite/ui-tokens build` then `yarn test --concurrency=1`: 41 files, 709 tests green.
- `yarn lint` 0 errors; `yarn check-locales` aligned.
- `cunningham-tokens-sass.scss`: rewritten by the build, restored with git. Branch diff vs `next` does not touch it (checked): the ticket adds no token.
- CT `e2e/gantt` on chromium-headless-shell (throwaway config, deleted, port outside 6006): 7/7 green.
- `yarn build` not re-run (the test and CT runs compile the same sources; the plan reports it green).

## Mutations (all restored, `git diff --exit-code` clean)
1. Anchor capture disabled in `requestZoom` (`if (false && ...)`): CT 1 red (the "keeps leftmost visible day" test). Unit tests cannot measure it; the CT test is not vacuous.
2. `scale.ts` windowing fix removed (`lastWindow` line): 3 red (day/week/month).
3. Hook always handed the callback (uncontrolled wrapper defeated): 2 red.

## Verification of the declared points
- Bounded ticks on every zoom: `MAX_DAYS` window unchanged in structure; the all-past fix is tested per zoom (days > 0, <= limit, ticks > 0, no today, positionOf).
- Anchor logic: date taken in the click handler (before the clamp), applied in `useLayoutEffect` only when the zoom reached equals the requested one, no scroll listener. CT covers widening and narrowing (clamped case). Correct.
- Controlled/uncontrolled: wrapper is right given the hook (`useControllableState.ts` only syncs from the prop when a callback exists and never self-updates then). Tests: controlled with and without callback, uncontrolled with `defaultZoom`.
- i18n: 4 keys x 5 locales present, parity script green.
- CT tests: not vacuous. Motion test asserts a non-zero duration first; anchoring test measures px/day from a bar. Tests (f)-(h) passed from the start (guards of t02), acknowledged in the plan.
- No throwaway config or artifacts in the diff. No TZ claim in the diff, so no child-process TZ test is due.
- Stories use `defaultZoom`; `Zoomed` controlled. Tab-stop test change is justified (three buttons precede the first row).
- Pressed cue (option C) is a documented design deviation with a contrast guard test and a forced-colors rule; accepted as decided by the owner flow.

## Findings
- minor: a controlled zoom request refused by the parent leaves `anchor.current` set; a later external change to that same zoom jumps to the old date. Already noted in the plan for t04. Fix cheaply by clearing the anchor when the zoom prop does not follow, or by deriving it from a pending request.
- minor: `scale.ts` doc comment line exceeds the usual width (`or on its last days when it ends before that window); bars are clipped...`); reflow.
- minor: `px()` reads `getComputedStyle` on each call and assumes rem day widths (declared `ponytail:` ceiling).
- minor: the root `container-type: inline-size` collapses the chart to zero width in shrink-to-fit parents; documented for the t04 MDX, which must carry it. Until t04 the stories/consumers must size the root.

## Not verified
- webkit and firefox CT (browsers not installed; only chromium run). Gesture: run `yarn test:ct` on a machine with all three browsers.
- Real screen-reader announcement of `aria-pressed` toggles and the visual look of the underline cue in the six themes (contrast is computed from tokens, not rendered). Gesture: open Storybook `Zoomed` in default/dark/dsfr and with NVDA/VoiceOver.
- Behaviour in a consumer with a root font size other than 16px (anchor approximate by design).
- `yarn build` and the PR line `Artifact: updated (version <id>)` (added by the main agent, noted only).

Max severity: minor
Ship allowed: yes
