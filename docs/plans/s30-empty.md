---
validated: yes
---
# Plan — Story s30-empty

Branch: `feature/s30-empty` (framing) · ticket: `feature/s30-empty/t01-empty-component`
Research: `docs/research/s30-empty.md`. Design: `docs/designs/s30-empty.md`.

## Target story
**As a** user facing a list with no content **I want** an empty state **so that** I understand why nothing is shown and what to do next. Complexity 1, 1 after research. New component, test-first inside the ticket.
- AC1 `Empty` renders an optional media slot, a title, a description and an optional action area.
- AC2 Presentational: no `role` beyond a landmark-free group; title is a heading level chosen by the caller (`headingLevel`).
- AC3 Spacing and colours from tokens; works in the six themes.

## Tickets (ordered)
### t01-empty-component
- **size:** S
- **estimate:** 1.5d
- **depends on:** none
- **scope:** `Empty` component, tokens, styles, stories, mdx, registration, changeset.

Tasks:
1. [ ] `Empty.spec.tsx` first (import `it` from `vitest`, `TZ=UTC`, `CunninghamProvider`), see it fail: (a) AC1: title renders in a heading; description, media and actions render only when given (absent slot = no element in the DOM); (b) AC2: each `headingLevel` 1–6 renders `h1`–`h6`, default `h3`; root has no `role` by default, `role="group"` only with `aria-label`/`aria-labelledby`; (c) `className` and extra props forwarded; actions slot accepts a `Button` and it stays operable by keyboard; (d) tokens: every key of `tokens.ts` has `--c--components--empty--<key>` in the six theme blocks of `cunningham-tokens.css` [red until `yarn build-theme`]; (e) stylesheet guard (read `index.scss` from disk): no hex, `rgb(`, `px`/`rem` literal outside comments or `var(--…)`, no literal fallback in `var(--…, X)`, logical properties only, every `tokens.ts` key read by the stylesheet; (f) contrast in six themes (technique of `timeline/Timeline.spec.tsx`): title and description on `surface.primary` >= 4.5, media colour >= 3. **A failing pair is a STOP: do not change a token, do not assert it, report it in the PR.**
2. [ ] `tokens.ts` (table of the design; literals only `3rem`, `28rem`), register `empty` in `cunningham.ts`, `yarn build-theme`; `cunningham-tokens-sass.scss`: restore the tracked version and hand-add only the empty blocks, diff-verified (flag in PR). (d) green.
3. [ ] `Empty.tsx`, `types.ts`, `index.tsx` (RAC `Heading`, `clsx`; no state). (a)–(c) green.
4. [ ] `index.scss` (BEM `c__empty*`, tokens only, logical properties, centred column, wrap); `@use "./components/empty";` in `src/library.scss`; exports (values and `export type`) in `src/index.ts`. (e), (f) green.
5. [ ] `empty.stories.tsx` (`Components/Empty`): `Default` (all slots), `TitleOnly`, `WithActions`, `HeadingLevels`; `Empty.mdx` (no autodocs tag): API, heading level guidance, decorative media, not a DataGrid replacement. Check in Storybook on the port from `bash .dm/lib/dm-port.sh` (run from `packages/ui-components`; never 6006) with axe in `default`, `dark`, `dsfr-light`; stop what you started.
6. [ ] Mutations, each reverted and recorded: hard-code `h3`, render empty wrappers for absent slots, add a `role`, literal in the SCSS, swap description colour for a surface colour: each red.
7. [ ] `.changeset/*.md` **minor** ("✨(Empty) add Empty state"). `yarn lint`, `yarn check-locales`, `TZ=UTC yarn test --concurrency=1`, `yarn build`; `git restore` `cunningham-tokens-sass.scss` after each run. PR line `Artifact: updated (version <id>)` is for the main agent.

## US totals
- **Person-days:** 1.5
- **Size mix:** 1×S
- Split needed: no. ADR needed: no.

## Run interdicts
No new dependency or locale key; no change to `DataGrid` or any existing component, token, story or hook; do not edit generated `src/cunningham-tokens.*`; no literal colour/spacing/radius in `index.scss`; never port 6006, no broad `pkill`; a failing contrast pair is a STOP-and-report.

## Files touched
`components/empty/{index.tsx,Empty.tsx,types.ts,tokens.ts,index.scss,empty.stories.tsx,Empty.mdx,Empty.spec.tsx}`, `cunningham.ts`, `src/library.scss`, `src/index.ts`, `.changeset/*`.

## Test strategy
jsdom: slots, heading levels, roles, textual stylesheet and token guards, six-theme contrast, each proven by mutation. No Playwright CT (no layout logic beyond centring; Storybook visual check).

## Definition of Done
Single PR into `next`, structured description (mutation log, STOP findings), lint, check-locales, tests, build green, review `Ship allowed: yes`, merged to `next`.
