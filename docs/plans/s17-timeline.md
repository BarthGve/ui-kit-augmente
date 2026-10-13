---
validated: yes
---
# Plan — Story s17-timeline

Branch: `feature/s17-timeline` (framing) · tickets: `feature/s17-timeline/<ticket-id>`
Research: `docs/research/s17-timeline.md` — read it first; this plan does not repeat it. Design: `docs/designs/s17-timeline.md` (anatomy, states, token table, gaps).

## Target story
**As a** user **I want** timeline events **so that** I read what happened in order. Complexity 3 in stories.md, 3 after research.
The premise "no equivalent in ui-kit" holds. New component, so each ticket is **test-first inside the ticket**: specs are written and seen failing before the code, and the ticket is committed only when everything is green (no `it.fails` ships).
Acceptance criteria (docs/stories.md):
- AC1 `Timeline` renders ordered events, each with a date, a title and optional content, in vertical orientation.
- AC2 A horizontal orientation is available and scrolls on a narrow viewport.
- AC3 An event can be in a state (done, current, upcoming), shown in more than a colour.
- AC4 Events are exposed as an ordered list to assistive technology.

## Tickets (ordered)
### t01-timeline-vertical
- **size:** M
- **estimate:** 2d
- **depends on:** none
- **scope:** `Timeline` vertical: `<ol role="list">`, items in caller order, localized `<time>`, optional content, three states with shape + hidden label + `aria-current`, tokens, styles, five locale keys, registration, stories, mdx, changeset. `orientation` prop typed `"vertical" | "horizontal"` but horizontal lands in t02 (t01 renders vertical for both and says so in the mdx). Covers AC1, AC3, AC4.

Tasks:
1. [x] Write `components/timeline/Timeline.spec.tsx` first (import `it` from `vitest`, `TZ=UTC`, `CunninghamProvider`) and see it fail: (a) AC4: root is an `ol` with `role="list"`, N `li` in the given order (not sorted), accessible name from `aria-label`; (b) AC1: each item has a `time` whose `dateTime` is the ISO date, a title, and the optional content only when given; (c) dates formatted with `currentLocale`: `2026-10-13` renders `Oct 13, 2026` in `en-US` and `13 oct. 2026` in `fr-FR`, a date-only string is not shifted in a negative-offset zone (format with `timeZone: "UTC"`), a `Date` instance works, an invalid string renders as given (never `Invalid Date`); `dateFormat` overrides; (d) AC3: `done` / `current` / `upcoming` each render a different marker (class `c__timeline__marker--<state>`; check glyph only for done), a visually hidden label from the locale (`Done`, `Current`, `Upcoming`), `aria-current="step"` only on the current item; no `state` renders neither label nor `aria-current`; (e) markers are `aria-hidden`; (f) `className` and extra props forwarded; empty `events` renders an empty list; (g) tokens: every key of `tokens.ts` has `--c--components--timeline--<key>` in the six theme blocks of `cunningham-tokens.css` [fails until `yarn build-theme`]; (h) stylesheet guard (read `index.scss` from disk): no hex, `rgb(`, `px`/`rem` literal outside comments or `var(--…)` names, no literal fallback in `var(--…, X)`, logical properties only (no `margin-left`/`padding-right`/`left:`/`right:`) [fails until the SCSS exists]; (i) contrast guard in the six themes (technique of `filter/contrast.spec.tsx`, helpers copied locally): title on `surface.primary` >= 4.5, date and upcoming text (`color--muted`) >= 4.5, current title >= 4.5, markers and upcoming ring >= 3 against `surface.primary`. **A failing pair is a STOP: do not change a token, do not assert it, report it (PR says so).**
2. [x] `tokens.ts` with the token table of the design, refs from `DefaultTokens`, literals only for `2px`, `1.5rem`, `12rem`; register as `timeline` in `packages/ui-components/cunningham.ts`; `yarn build-theme` (build `@gouvfr-lasuite/ui-tokens` first if needed); `cunningham-tokens-sass.scss`: restore the tracked version and hand-add only the timeline blocks, diff-verified (flag in the PR). Never hand-edit `cunningham-tokens.*`. (g) green.
3. [x] Locales: keys `components.timeline.state.{done,current,upcoming}` in the five `src/locales/*.json`; `yarn check-locales`.
4. [x] `Timeline.tsx`, `types.ts` (`TimelineProps`, `TimelineEvent`, `TimelineState`), `index.tsx`: `useCunningham()` for `currentLocale` and `t`; `Intl.DateTimeFormat`; decorative `Icon check`; no state, no `useControllableState`. (a)–(f) green.
5. [x] `index.scss` (BEM `c__timeline*`, tokens only, logical properties, connector line between markers, marker shapes per state, visually hidden label); `@use "./components/timeline";` in `src/library.scss`; exports (values and `export type`) in `src/index.ts`. (h) and (i) green.
6. [x] `timeline.stories.tsx` (`Components/Timeline`): `Default`, `WithStates`, `WithContent`, `Localized` (fr-FR); `Timeline.mdx` (no autodocs tag): API, states, order is the caller's, dates and time zone, horizontal coming in t02. Check the stories in Storybook on the port from `bash .dm/lib/dm-port.sh` (never 6006) with the a11y addon in `default`, `dark`, `dsfr-light`; stop what you started. Limits not checkable by the agent go in the PR description.
7. [x] Mutations, each reverted and recorded in the PR: drop `role="list"`, sort events by date, drop the hidden state label, `aria-current` on every item, remove `timeZone: "UTC"`, put a literal back in the stylesheet, swap `color--muted` for a surface colour: each red.
8. [x] `.changeset/*.md` **minor** for `@gouvfr-lasuite/ui-components` ("✨(Timeline) add Timeline"). `yarn lint`, `yarn check-locales`, `TZ=UTC yarn test --concurrency=1`, `yarn build`; restore `cunningham-tokens-sass.scss` if rewritten. PR line `Artifact: updated (version <id>)` is for the main agent.

### t02-timeline-horizontal
- **size:** S
- **estimate:** 1d
- **depends on:** t01-timeline-vertical
- **scope:** `orientation="horizontal"`: layout, scroll region, keyboard scroll, real-browser check. Covers AC2.

Tasks:
1. [x] Extend `Timeline.spec.tsx` first and see it fail: horizontal renders the `ol` inside a `role="region"` wrapper with `tabindex="0"` and an accessible name (from `aria-label`, or a locale key `components.timeline.region` when none is given: five locales); vertical renders no wrapper; item order and `time` unchanged; stylesheet guard still green (`item-min-width` token read).
2. [x] CT first, `e2e/timeline/timeline.spec.tsx` + `e2e/helpers/mount-timeline.tsx` (`CunninghamProvider`, chromium; throwaway uncommitted config on the `dm-port.sh` port): in a 320px container with 8 events the region has `scrollWidth > clientWidth` and `overflow-x: auto`; the page itself does not scroll horizontally; `Tab` focuses the region, `ArrowRight` scrolls it (`scrollLeft > 0`); focus outline `2px solid` inside the region box; vertical mode: items stack (increasing `top`), no horizontal overflow. Computed numbers recorded in the PR: marker size 24px, connector 2px, item min-width 192px.
3. [x] Implement the horizontal layout in `Timeline.tsx` / `index.scss` (flex row, `overflow-x: auto`, connector across items, logical properties). Tests green.
4. [x] Stories `Horizontal`, `HorizontalNarrow` (container 320px) and mdx section; a11y addon in the three themes; keyboard pass; stop the server.
5. [x] Mutations (clear `playwright/.cache` between CSS mutations): drop `overflow-x`, drop `tabindex`, drop the region name: each red. Changeset: none (t01 minor covers the component). `yarn lint`, `yarn check-locales`, `TZ=UTC yarn test --concurrency=1`, `yarn build`, CT chromium for `e2e/timeline`. PR line `Artifact: updated (version <id>)` by the main agent.

### t03-timeline-marker-contrast
- **size:** S
- **estimate:** 1d
- **depends on:** t01-timeline-vertical
- **scope:** `components/timeline/tokens.ts` (two values), `Timeline.spec.tsx` (contrast guard), no markup, no stylesheet, no existing global token touched. Fixes the owner-reported STOP of t01: the `done` and `current` markers are 2.42 to 2.48:1 against `surface.primary` in `dark`, `dsfr-dark` and `anct-dark` (needs 3:1, non-text).

Tasks (test first):
1. [ ] In `Timeline.spec.tsx`, remove the six `KNOWN_FAILURES` pairs so that `marker-done-background` and `marker-current-background` are asserted at >= 3:1 against `surface.primary` in the six themes, and add: the check glyph colour (`marker-done-color`) against `marker-done-background` >= 3:1 in the six themes. See it red (the six dark-theme pairs).
2. [ ] In `tokens.ts` repoint `marker-done-background` to `contextuals.border.semantic.success.primary` and `marker-current-background` to `contextuals.border.semantic.brand.primary` (measured: 3.45 to 3.51:1 in the three dark themes, unchanged colour in the three light themes since the two tokens resolve to the same value there: the guard proves it). `yarn build-theme`; restore `cunningham-tokens-sass.scss` and hand-add only the changed timeline lines, diff-verified (flag in the PR). If the glyph pair fails in a theme: STOP, report, do not change an existing token.
3. [ ] Browser check in Storybook (port from `bash .dm/lib/dm-port.sh`, run from `packages/ui-components`) of `WithStates` in `default`, `dark`, `dsfr-light`: markers keep their shape and are visible; axe. Stop what you started.
4. [ ] Mutations (reverted, recorded): repoint a marker back to `background.semantic.*`, swap the glyph colour for the surface colour: each red. Changeset `patch` ("♿️(Timeline) raise the done and current marker contrast in dark themes"). `yarn lint`, `yarn check-locales`, `TZ=UTC yarn test --concurrency=1`, `yarn build`. PR line `Artifact: updated (version <id>)`: the Timeline page tokens (two values) and the removal of the contrast note, by the main agent.

## US totals
- **Person-days:** 4.0 (2 + 1 + 1)
- **Size mix:** 1×M, 2×S
- Split needed: no.
- ADR needed: no.

## Run interdicts
- No new dependency (`Intl` is stdlib), no ADR; no change to any existing component, token, story or hook; do not edit generated `src/cunningham-tokens.*`.
- No literal colour, spacing or radius in `index.scss`; literals only in `tokens.ts` (`2px`, `1.5rem`, `12rem`).
- No sorting, no data fetching, no compound `<Timeline.Item>` API, no icon-per-event prop, no animation.
- Never port 6006, never broad `pkill`, a ticket never merges with a red test; a failing contrast pair is a STOP-and-report.

## Files touched
`components/timeline/{index.tsx,Timeline.tsx,types.ts,tokens.ts,index.scss,timeline.stories.tsx,Timeline.mdx,Timeline.spec.tsx}`, `cunningham.ts`, `src/library.scss`, `src/index.ts`, `src/locales/*.json`, `e2e/timeline/timeline.spec.tsx`, `e2e/helpers/mount-timeline.tsx`, `.changeset/*`.

## Test strategy
jsdom (Vitest, Testing Library): semantics, order, locale and time-zone dates, states, textual stylesheet and token guards, six-theme contrast. Playwright CT chromium: real scroll and focus for horizontal. Lessons applied: `TZ=UTC`; bounded inputs; contrast with STOP; hand-added sass blocks diff-verified; every guard proven by mutating production code; no broad `pkill`.

## Definition of Done
Per ticket: single PR into `next`, structured description (mutation log, STOP findings), readable diff, lint, check-locales, tests, build and CT green, review `Ship allowed: yes`, merged to `next`.
