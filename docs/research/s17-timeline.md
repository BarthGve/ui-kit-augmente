# Research — Story s17-timeline

Worktree `.worktrees/s17-timeline`, branch `feature/s17-timeline` (from `next` at `475d5305`). Nothing was built; every claim comes from reading `packages/ui-components` source. `docs/reviews/stories.md` says `Stories ready: yes`.

## The five structuring facts
1. **The premise "no equivalent in ui-kit" is true.** No `components/timeline/`; the only `timeline` hits are comments in `gantt/Gantt.tsx:837` and `gantt/index.scss:2,130`, about the Gantt's scrolling area, unrelated. PRD line `docs/prd.md:39`: "Timeline, 3, ordered event list, several states, vertical or horizontal".
2. **Pure presentational component, no new dependency, no ADR.** A semantic `<ol>` of `<li>`; no React Aria primitive exists for it (the pattern is a list, not a widget). Model: the s10 Card / s11 Accordion folder layout (`index.tsx`, `Timeline.tsx`, `types.ts`, `tokens.ts`, `index.scss`, stories, mdx, spec, `e2e/timeline/` + `e2e/helpers/mount-timeline.tsx`), registration in `cunningham.ts`, `src/library.scss`, `src/index.ts`.
3. **Date formatting needs no helper**: the repo has no date formatter in `src/` outside Calendar (`@internationalized/date`, a calendar widget, not reusable). `useCunningham()` returns `currentLocale` (`provider/index.tsx:19-21`), so `new Intl.DateTimeFormat(currentLocale, …)` (stdlib) satisfies the agentic note "dates formatted in the active locale". Input: `Date | string` (ISO); rendered inside a `<time dateTime>`.
4. **State colours exist as semantic tokens, no gap**: done = `content/background.semantic.success.*`, current = `…semantic.brand.*` (`cunningham-tokens.css:415-420,491-494,503-506`), upcoming = `…semantic.neutral.*` (`:495-498`). The AC "shown in more than one colour" must not rely on colour alone: use a different marker glyph per state (check for done, filled dot for current, empty ring for upcoming) plus a visually hidden state label (needs a locale key in five locales, `yarn check-locales`).
5. **Horizontal orientation and "scrolls on a narrow viewport"** is the only non-trivial part: a flex row with `overflow-x: auto` on a wrapper, a focusable scroll region (`tabindex="0"`, `role="region"` + `aria-label`) to be keyboard scrollable (axe `scrollable-region-focusable`). Needs a real-browser Playwright CT check (jsdom has no layout).

## Target story
s17-timeline (docs/stories.md:289), complexity 3. As a user I want timeline events so that I read what happened in order.
- AC1 `Timeline` renders ordered events, each with a date, a title and optional content, in vertical orientation.
- AC2 A horizontal orientation is available and scrolls on a narrow viewport.
- AC3 An event can be in a state (done, current, upcoming), shown in more than a colour.
- AC4 Events are exposed as an ordered list to assistive technology.
Dependencies: none. Notes: no equivalent in ui-kit, design to be reviewed; dates formatted in the active locale; out of scope: any data fetching. (s37/Marker mention in stories.md:914 says Marker may be reused by s17: not a dependency.)

## Current state of the code
- No `components/timeline/`. Closest models: `card/` and `accordion/` (all files listed in fact 2), `tabs/` for RAC-free list styling, `separator/` for the 1px border token `--c--contextuals--border--surface--primary`.
- Registration points: `cunningham.ts` (import + key = folder name in `componentTokenDefaults`), `src/library.scss` (`@use`), `src/index.ts` (values + `export type`).
- Icons: `components/icon/Icon.tsx` (`<Icon name="check" />` renders `<span class="material-icons">`, to be `aria-hidden`).
- Tokens: `border.semantic.brand.primary` for the focus ring (Card/Accordion use `focus-ring-*` component tokens, 2px/2px literals commented as design-system gaps).

## Anchor points
- New `packages/ui-components/src/components/timeline/` (`index.tsx`, `Timeline.tsx`, `types.ts`, `tokens.ts`, `index.scss`, `timeline.stories.tsx`, `Timeline.mdx`, `Timeline.spec.tsx`).
- `cunningham.ts`, `src/library.scss`, `src/index.ts`, `src/locales/*.json` (5 locales: state labels, region label), `e2e/timeline/timeline.spec.tsx`, `e2e/helpers/mount-timeline.tsx`, one `minor` changeset, then `yarn build-theme` (restore `cunningham-tokens-sass.scss` and hand-add only the new blocks, diff-verified, as in s07 t03).

## Verified APIs / functions
- `useCunningham(): { t(key, vars?), currentLocale }` (`provider/index.tsx:25`), throws outside `CunninghamProvider`.
- `Intl.DateTimeFormat` (stdlib), `clsx`, `DefaultTokens` from `@gouvfr-lasuite/ui-tokens`.
- Locale files `src/locales/{en-US,fr-FR,…}.json`, checked by `yarn check-locales` (same keys in all five).

## Traps & constraints
- **Date parsing**: `new Date("2026-10-13")` is UTC midnight; formatting in a negative-offset zone shows the previous day. Format with `timeZone: "UTC"` when the input is a date-only string, and run tests with `TZ=UTC` plus one fixed non-UTC case. Invalid date: render the raw string, never `Invalid Date`.
- **Order is the caller's**: the component renders `events` in the given order; sorting by date is out of scope (a hidden sort would reorder an intentional order). Say so in the mdx.
- **Semantics**: `<ol>` must keep list semantics: `list-style: none` removes them in Safari/VoiceOver unless `role="list"` is set; set `role="list"` explicitly. `aria-current="step"` on the current item; the state text visually hidden, not `title`.
- **Contrast**: run the six-theme contrast guard (technique of `button/focus-ring.spec.tsx`, `filter/contrast.spec.tsx`) for title and date text on the surface and for the three markers (non-text 3:1).
- **No hard-coded values**: literals only where no global token exists, listed as design-system gaps (marker size, connector width), as Card did. `cunningham-tokens.*` are generated, never edited.
- **RTL**: use logical properties (`inline-start`, `padding-inline`) for the vertical connector.
- Design-system gap to report, not fill: no `Timeline` in `docs/design-system.md` (it is "Planned" at line 70).

## Open questions
1. **API shape**: `events` array prop (`{ id, date, title, content?, state? }`), proposed (data is a list, content is plain `ReactNode`); a compound `<Timeline.Item>` form is YAGNI. Owner may ask for the compound form later.
2. **Default state** when `state` is omitted: proposed "no marker state" (neutral, no hidden label), not "upcoming".
3. **Horizontal item width**: fixed min-width per item (token) with wrapping title, proposed 12rem; owner to confirm in the design review.
4. **Date format**: `dateStyle: "medium"` default, a `dateFormat?: Intl.DateTimeFormatOptions` prop to override; proposed.
5. Does a locale key for "done / current / upcoming" go under a new `components.timeline.*`? Proposed yes, five locales.

## Real complexity
Story says 3; **stays 3**. Layout is plain CSS and the list needs no library, but the story combines two orientations, three states with non-colour cues, locale-aware date handling with a time-zone trap, five locales, six-theme contrast and a real-browser scroll check. No split needed: vertical (AC1/3/4) and horizontal (AC2) share the same markup and tokens.

## Split proposal
None.
