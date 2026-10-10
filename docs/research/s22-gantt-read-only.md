# Research — Story s22-gantt-read-only

Worktree `.worktrees/s22-gantt-read-only`, branch `feature/s22-gantt-read-only`. Nothing was run or built: every claim comes from reading the source (`packages/ui-components`) and the installed `@internationalized/date` 3.12.0 types under the main checkout's `node_modules` (read-only).

## The structuring facts
1. **The premise "no equivalent in ui-kit" is true.** `components/` has no `gantt`, `timeline` or `scheduler` folder (list read: accordion, alert, badge, button, calendar, card, context-menu, data-grid, dnd, …). `docs/prd.md:13` says the same. The only neighbour in the backlog is **s17-timeline** (`stories.md:289`): a vertical/horizontal event list, no time scale, no bars. **No overlap and no shared code**: the only thing that could be shared is the date formatting helper, and s17 is not planned yet, so nothing is factored now. `calendar/` is a month-grid date picker (RAC `Calendar`), unrelated to a scale.
2. **Date tooling already installed: `@internationalized/date` 3.12.0** (direct dependency, `package.json:70`; used by `calendar/` and `forms/date-picker/`, AGENTS says reuse it). Verified in `dist/types.d.ts`: `CalendarDate` (`add`/`subtract({days|weeks|months})`, `compare`, `toDate(tz)`, `toString()` = ISO `YYYY-MM-DD`), `parseDate(string)`, `today(timeZone)`, `getLocalTimeZone()`, `startOfWeek/endOfWeek(date, locale)` (locale-aware first day), `startOfMonth/endOfMonth`, `isSameDay`, `isToday(date, tz)`, `DateFormatter` (an `Intl.DateTimeFormat` wrapper). **There is no "days between" function**: the day offset is `(b.toDate("UTC") - a.toDate("UTC")) / 86_400_000`. UTC has no DST, so the integer is exact (a local-zone `Date` difference would be 23/25 h on a DST day and off by one after rounding). The whole scale is therefore `CalendarDate` integers; no `Date` is ever stored.
3. **Time-zone/DST trap is avoided by contract, not by code**: the data are calendar dates (`"2026-03-30"`), not instants. A start/end is a day, the end is **inclusive** (a task on one day has `start == end` and is one day wide). Timestamps with time are out of scope (stories.md: "dates are plain data supplied by the caller"). The only place a time zone appears is **"today"**: `today(getLocalTimeZone())`, injectable through a `today` prop (tests and stories need a fixed day, otherwise the marker moves and snapshots rot). Midnight rollover while the page stays open is not handled in v1 (see open questions).
4. **Virtualisation: nothing needed now, nothing new to install.** Installed and relevant: `@tanstack/react-table` 8.21.3 (headless table, **no** virtualiser; `@tanstack/react-virtual` is not in `node_modules/@tanstack`: only `query-core`, `react-query`, `react-table`, `table-core`); `react-virtualized` 9.22.6 (direct dependency, used only by the lazy PDF viewer, `preview/viewers/pdf-preview`; its stylesheet is `@use`d in `library.scss:55`, which is global weight already paid). Using `react-virtualized` would need no ADR but is a class-component, element-measuring library that fights a single CSS sticky grid. **Proposal: v1 renders every row** and tells the consumer the practical ceiling; rows use `content-visibility: auto` + `contain-intrinsic-size` (native, zero dependency) so off-screen rows skip layout/paint. The API reserves `aria-rowcount`/`aria-rowindex` so a later windowing story does not change it. A heavy virtualiser would need an ADR: **none is needed now.**
5. **Keyboard: the arrows are NOT free, and no existing hook fits.** `hooks/useArrowRoving.ts` handles `ArrowLeft/Right` only, on `button` descendants, with capture listeners and a space-to-click workaround: not reusable (same conclusion as s11). RAC has `GridList`, `Table`, `ListBox`, `Tree` with arrow navigation (`useSelectableCollection`), but they model a **single** collection of selectable items, force `Collection`/`Item` rendering, and wrap rows in their own DOM; a bar track positioned in absolute pixels inside a RAC `GridList` row fights it, and selection semantics are not wanted (read-only, no selection; s23 will want focus ≠ selection). **Proposal: a roving tabindex implemented by the component** (~25 lines): one row has `tabindex="0"`, the others `-1`; `ArrowDown/Up` move to the next/previous row, `Home/End` to first/last, `preventDefault` only when focus moved; `Tab` leaves the chart (not through every row). No wrap (a vertical list with Home/End; wrapping on a long schedule is disorienting; open question).
6. **Semantics: `grid` with row/rowheader/gridcell on one DOM tree** (see design). A fixed task list and a scrolling chart are normally two panes, which breaks the one-row-two-places relationship for assistive tech and requires a scroll sync. **Single scroll container + CSS `position: sticky`** keeps one DOM row per task: the task-name cell is `sticky; inset-inline-start: 0`, the axis header is `sticky; top: 0`. No JS scroll sync, no `scroll` listener, one `aria-rowindex` per task. Cost: both axes scroll in one box, so the container needs a fixed max block-size (consumer-provided `height`) to make the header sticky; accepted. Rejected alternative: two panes + `scrollTop` mirroring (drift, double a11y tree, jank on touch). Browser support of `sticky` inside `overflow: auto` grids is universal for the supported browsers; the Playwright CT must still measure it (jsdom cannot: no layout).
7. **Bar width is geometry, not text**: `left = startOffsetDays × dayWidth`, `width = (durationDays) × dayWidth` in CSS custom properties (`--gantt-day-width`, per-row `--start`, `--span` as integers), computed in a pure util from `CalendarDate`s. Zoom changes `--gantt-day-width` only (day 40px, week 12px, month 4px, design values) and the axis ticks (days/weeks/months). One pure function `buildScale({tasks, zoom, today, locale}) → {origin, days, ticks, positionOf(task)}` is the heart of the component and is unit-testable without a DOM.
8. **Performance**: at 1000 days × 500 rows in day zoom the grid is ~500 rows × (one bar) + ~1000 header ticks: ticks are 1 element per tick (not per cell); the row background lines use one repeating `linear-gradient` per row/track instead of cells, so DOM size is O(rows + ticks), not O(rows × days). No per-cell DOM.

## Target story
**As a** project manager **I want** to see tasks on a time axis **so that** I read the schedule at a glance. Complexity 3 in stories.md (`:381`). Acceptance criteria:
- AC1 `Gantt` renders one row per task, bar positioned and sized from start and end dates.
- AC2 Zoom between day, week and month; horizontal scroll with a fixed task list.
- AC3 Today is marked; a task with no dates is shown without a bar.
- AC4 Each bar exposes name and dates to AT; Tab enters the chart, Up/Down move between task rows, Home/End jump to first/last, the focused task announces name and dates.

Dependencies: none. s23 (move/resize, controlled, `onTaskChange`, keyboard Alt/Shift+arrows, snapping to the zoom unit) and s24 (dependency links, `onDependencyChange`, cycle detection) build on it. Agentic notes: design to be produced and reviewed before planning; do not build editing here.

## Forward compatibility (what the data model must reserve)
- Task = `{ id: string; name: string; start?: DateInput; end?: DateInput; … }`, `DateInput = string (ISO "YYYY-MM-DD") | CalendarDate`. **`id` is required and stable** (s23 reports `onTaskChange(id, {start, end})`; s24 references tasks by id). Order = array order (controlled, never mutated by the component).
- Extra fields are not invented now; `Task` is an interface the later stories extend with optional fields (`dependsOn?`, `isReadOnly?`), which is non-breaking.
- Zoom is a union `"day" | "week" | "month"` exported as `GanttZoom`; s23's "snap to the zoom unit" needs the same union and the scale util's `snap(date, zoom)`, which s22 does not ship (YAGNI) but the util's shape (`positionOf`, `dateAt(offsetPx)` inverse) must allow: the pure function takes `zoom` and exposes `dayWidth`, so the inverse is a one-liner later.
- The bar element is a stable DOM node (`.c__gantt__bar`, `data-task-id`) inside the row's gridcell: s23 attaches pointer handlers/handles to it; s24 draws an overlay SVG layer as a sibling of the rows. The row/cell structure must not be reshuffled by those stories.
- Controlled props pattern (value in, callback out) as in Accordion; s22 ships no callback besides `onZoomChange`.

## Complexity re-score
Story says 3; **stays 3**. No dependency, no editing; the weight is the scale math, the sticky grid and the keyboard/a11y semantics. Closer to 3 than 2 because of the real-browser sticky/scroll check and the date helpers. 4 tickets, ~5 person-days.

## Current state of the code
- No `components/gantt/`. Models: `card/` (s10), `accordion/` (s11: RAC wrapper, native keydown handling, `tokens.ts`, e2e CT, MDX).
- Registration: `src/library.scss`, `src/index.ts`, `cunningham.ts` (`componentTokenDefaults`, key = folder name).
- i18n: `useCunningham().t` with keys under `components.<name>.*` in `src/locales/{de-DE,en-US,es-ES,fr-FR,nl-NL}.json` (`yarn check-locales`); interpolation `{page}` style (`pagination.goto_page_aria`). The Gantt needs keys (zoom labels, row announcement).
- Tokens: contextual tokens read in `src/cunningham-tokens.css`; the design maps them.
- Tests: Vitest + jsdom (no layout, no `getAnimations`, SCSS not rendered: textual style checks, s10 technique); Playwright CT in `e2e/<name>/` (chromium only locally) for sticky/scroll measurement.

## Anchor points
- New `components/gantt/` (`index.tsx`, `Gantt.tsx`, `types.ts`, `scale.ts`, `tokens.ts`, `index.scss`, `gantt.stories.tsx`, `Gantt.mdx`, `scale.spec.ts`, `Gantt.spec.tsx`); `e2e/gantt/` + `e2e/helpers/mount-gantt.tsx`.
- `cunningham.ts` (import + key `gantt`), `src/library.scss` (`@use`), `src/index.ts` (values + `export type`), five locale files, one `.changeset/*.md` (minor).
- Then `yarn build-theme` (restore `cunningham-tokens-sass.scss` if it drifts; hand-add only the gantt blocks, flag it).

## Traps & constraints
- **Inclusive end date**: off-by-one on bar width is the classic bug; test `start == end` = 1 day wide, and a month-boundary span.
- **`parseDate` throws on a malformed string**: the component must not crash a whole chart for one bad row; an unparseable or `end < start` task is rendered as a task **without a bar** (same as no dates) and `console.warn` once in dev. Decision for the plan: treat as no-dates, no throw.
- **Task with only one of start/end**: treated as no dates (a bar of unknown length would lie). Documented.
- **Axis origin/extent**: derived from the min start and max end of valid tasks, padded to week/month boundaries (`startOfWeek(…, locale)` so the first column matches the locale's first weekday); `today` is included in the range if close, not forced (a today marker far outside the range is simply not drawn; open question). All tasks without dates → empty-axis state.
- **Locale**: week start and date labels from `locale` (`useCunningham` / `react-aria` `useLocale`), formatted by `DateFormatter`/`Intl`, never hand-built strings ("3 mars 2026" in French).
- **Sticky + `overflow: clip`**: a parent with `overflow: hidden/clip` breaks `position: sticky`; the scroll container is the only overflow box.
- **Focus ring clipped by the sticky cell/scroll box**: ring is an `outline` with negative offset on the row (as Accordion), verified in the CT.
- **RTL**: `inset-inline-start` for the sticky column; bar positioned with `inset-inline-start` so RTL mirrors (axis direction in RTL is out of scope; open question).
- **Forced-colors**: bars are backgrounds (dropped in forced colors): need a real border (`1px solid`) and `Highlight`/`CanvasText` fallback, otherwise bars vanish.
- `hidden`-free: no collapsed content; no `aria-hidden` on focusable children.
- Editing `cunningham-tokens.*` by hand is forbidden.

## Open questions
1. **Role: `grid` vs a simpler `list`/`treegrid`.** Proposed `grid` (rows, a rowheader, one gridcell for the track), roving tabindex on rows, since APG grid fits "navigate rows, read cells". `treegrid` is for s-later hierarchies (WBS) and not requested. Confirm.
2. **No wrap on Up/Down** (Home/End instead). Accordion wrapped; here the list is long and ordered. Confirm.
3. **Midnight rollover** of "today" and a **today marker outside the range**: not handled in v1 (marker hidden if outside). Confirm.
4. **Virtualisation threshold**: none in v1; `content-visibility` only. If the owner needs >~500 rows, a follow-up story with an ADR (windowing inside a sticky grid is non-trivial).
5. **RTL axis mirroring** out of scope.
6. **Bar colour per task / status**: not in the data model now (no colour invention). One neutral-brand bar colour. Confirm.
7. **Zoom control placement**: inside the component header (segmented buttons) and controlled/uncontrolled (`zoom`/`defaultZoom`/`onZoomChange`) as Accordion's pattern. Confirm.
