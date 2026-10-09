# Review s10-card / t02-card-interactive

Branch `feature/s10-card/t02-card-interactive` verified. Diff `next...HEAD`.

## Facts run myself
- `yarn lint`, `yarn check-locales`, `yarn build` (tsc included): green. `yarn test`: 575/575 green on two runs. One first run exited 1 right after lint (output truncated, not reproduced in two re-runs nor in `vitest run`): unexplained flake, to watch.
- Build rewrote `cunningham-tokens-sass.scss` (unrelated drift); restored with `git checkout`.
- Playwright CT, chromium headless shell 1243, throwaway config on the `dm-port.sh` port, cache cleared: 4/4 green. Config deleted, `.cache` removed, Storybook stopped, port free, tree clean.

## Mutations (all restored, `git diff --exit-code` clean)
| Mutation | Result |
| --- | --- |
| Remove the `outline` declarations of `:focus-visible` | 1 unit red |
| `:focus-visible` -> `:focus` (unit) | 1 unit red (textual regex) |
| `:focus-visible` -> `:focus` (CT) | "no ring after mouse click" red (1/4); keyboard tests stay green, expected |
| Link card rendered as `div` | 1 unit red |
| Static card `tabIndex={0}` | 1 unit red |
So the central AC2 invariants bite; pointer-vs-keyboard ring is guarded only by the real-browser test, as the plan intended.

## Checks requested
1. Card.tsx: three separate components, `useButton` never conditional; dispatcher on `onPress`/`href`. Union `href?: never` forbids the combination (`ts-expect-error` compiled by build). Root props (`className`, `aria-*`, `data-*`, `id`) go through `...props` in all three (RAC Link forwards DOM props; `mergeProps` keeps consumer handlers). `style`: omitted from `LinkCardProps` because RAC `style` can be a render function; static accepts it. Small inconsistency, acceptable and typed (compile error, not silent). Space/Enter: handled by `useButton`/usePress (preventDefault on Space, one activation) and proven once per key in CT. `disabled` out of scope per plan.
2. See mutations above.
3. forced-colors / reduced-motion: textual only; acceptable (plan says so, jsdom cannot render them, rules are 3 lines tokenless system keywords). Not browser-verified.
4. `text-decoration: none` (needed for `<a>`), shared `:hover,:active` (design "active same as hover"), `ease-out` token and `globals.transitions.duration`: conform; no literal colour/spacing.
5. No `autodocs` in Tabs either, Tabs and Card both use `<Meta of=... name="Docs" />` in MDX: pattern confirmed.
6. Contrast helpers duplicated from `button/focus-ring.spec.tsx`: minor, known, recorded in the plan; extract on a third use.
7. Changeset text amended, still minor, matches the API.
8. Artifact version 1791567365-c37c: I cannot open it. Human to confirm the Card page (href/onPress, interactive section, guards), catalogue entry and `project/canvas.json`, and that the PR body carries `Artifact: updated (version 1791567365-c37c)`.
9. Axe (4.10.3) on the 5 Card stories x default/dark/dsfr-light, with 0 and 600 ms wait: only one hit, dark `header-body-footer` (static story, contains Badge and Button) at 0 ms, `color-contrast`; zero at 600 ms. The static card has no transition and the interactive stories were clean at 0 ms: it is a theme-application transition on the embedded Button/Badge, a harness artefact, not a Card defect. No finding.

## Findings
- minor: duplicated contrast helpers in `Card.spec.tsx`.
- minor: link card refuses `style` while static accepts it (documented by type; could be noted in Card.mdx).
- minor: unexplained single `yarn test` failure on first run (not reproducible).

## Not verified
- Artifact content (cannot open).
- webkit/firefox (not installed): focus-visible and Space behaviour on Safari (Safari does not Tab to links by default) never run.
- forced-colors and reduced-motion in a browser; only textual.
- Screen reader announcement of `div role=button` / link cards. Human gesture: VoiceOver pass on both stories, and Windows High Contrast check.

Max severity: minor
Ship allowed: yes
