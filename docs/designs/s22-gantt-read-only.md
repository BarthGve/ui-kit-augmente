# Design — Story s22-gantt-read-only

Component story, no screen. Agent-derived from `docs/design-system.md` and from the Card/Accordion designs (`docs/designs/s10-card.md`, `s11-accordion.md`); to be reviewed by the owner before planning (stories.md: "design to be produced and reviewed"). Values read from `packages/ui-components/src/cunningham-tokens.css`. Reference mockup: `docs/designs/s22-gantt-read-only.html` (static, a reference, not code).

## Screen(s)
Anatomy of one `Gantt`: a single scroll box (both axes) with a sticky header and a sticky first column.

```
+-----------------------------------------------------------+  c__gantt   (toolbar above the box)
| [ Day | Week | Month ]                                    |  c__gantt__toolbar > zoom group
+--------------+--------------------------------------------+  c__gantt__scroller (overflow auto, fixed block-size)
| Task      (sticky corner)| Mar 2026   | Apr 2026 ...       |  c__gantt__axis (sticky top)
+--------------+--------------------------------------------+
| Design       |   [=======]                                |  row: __row > __task (sticky start) + __track > __bar
| Build        |        [==========]                        |
| Release      |  no dates (no bar)       |                 |  task without dates: no bar, muted label
|              |              :  <- today marker (vertical) |  c__gantt__today (spans all rows)
+--------------+--------------------------------------------+
```
- `Gantt` takes `tasks: GanttTask[]` (`{id, name, start?, end?}`, ISO `"YYYY-MM-DD"` or `CalendarDate`, end inclusive), `zoom?` / `defaultZoom?` / `onZoomChange?` (`"day" | "week" | "month"`, default `"week"`), `today?` (default today in the local zone), `aria-label` (required, names the grid), `className`. No `items` children API: data-driven, because a row is geometry.
- **Task list pane is fixed** by `position: sticky; inset-inline-start: 0` on the first cell of every row (opaque `background-color` so bars scroll under it); **the timeline scrolls horizontally** in the same box. The header axis is `position: sticky; top: 0`. A single scroll container: no scroll synchronisation.
- **Header axis**: two tiers. Upper tier = months (or years in month zoom) , lower tier = days (day zoom: day numbers), weeks (week zoom: week-start day numbers), months (month zoom: short month names). Labels formatted with `Intl`/`DateFormatter` in the active locale.
- **Bar**: a rounded rectangle positioned by `--gantt-start` and sized by `--gantt-span` (integers, in days) times `--gantt-day-width`. Minimum drawn width 1 unit of the zoom. Bar height smaller than the row so rows read as lanes.
- **Today marker**: a 2px vertical line spanning header + rows at today's column, with a small label chip "Today" in the axis; not drawn when today is outside the axis range. Marked by line + label (shape), not colour alone.
- **Task without dates** (no dates, one date only, or `end < start`): the row exists, the track is empty, the task cell shows the name and a muted "No dates" text. No bar, no placeholder shape.
- Zoom control: a group of three toggle buttons (`role="group"` labelled, `aria-pressed`) using the existing `Button` (variant `tertiary`/`secondary`, size `small`), not a new component. Day = 40px per day, Week = 12px per day, Month = 4px per day (`--gantt-day-width`, literal gap 4).
- Row height 40px (touch target above 24px); first column width `min(16rem, 40%)`, truncated names with `text-overflow: ellipsis` and a `title`-free full name through the accessible name.
- Variants: **none**. One look, one bar colour (no per-task colour in the data model).

## Mockup
`docs/designs/s22-gantt-read-only.html`: light and dark, day/week/month rows, today marker, no-dates row, focus ring and hover rows. Colours are the resolved hexes of the tokens below; reference only.

## Reused components (from the design system)
- `Button` (zoom toggles). `Icon` is not needed (no glyph). Visual neighbours: `Card`/`Accordion` (border colour, hover tertiary background, outline ring) and `DataGrid` (table density).
- Nothing else is composed; no new base component.

## States
| State | Rendering |
|---|---|
| default | rows separated by hairlines (`border-color`), vertical grid lines per zoom unit drawn with one repeating background (no per-cell DOM) |
| hover (row) | row background `row-background-color--hover` (neutral tertiary) on the task cell and the track; cursor default (read-only, nothing is clickable) |
| focus-visible (row) | `outline` `focus-ring-width` solid `focus-ring-color` on the row, offset `focus-ring-offset` negative so the ring is not clipped by the scroll box; only keyboard focus (`:focus-visible`); the task cell keeps its opaque background |
| today column | marker line `today-color`, label chip in the axis |
| no dates | muted text (`color--muted`), no bar |
| empty (no tasks) | the axis header remains for the current month, one centred message "No tasks" (`role="status"` not needed: static); the grid keeps `aria-rowcount="1"` |
| zoom pressed | zoom button `aria-pressed="true"` with the existing Button pressed look; zoom change keeps the scroll anchored on the viewport's left date (plan: `scrollLeft` recomputed from the left date; Playwright CT checks it) |
| forced-colors | bars get `border: 1px solid CanvasText`/`background: Highlight`; today line `Highlight`; focus ring `outline-color: Highlight`; grid lines `GrayText`; bars never rely on background alone |
| reduced motion | no transition on zoom (bars/axis jump), no smooth scroll; when motion is allowed: `width`/`left` transition on zoom with `globals.transitions.duration` and `ease-out` |

Loading/error/success: not applicable (presentational, data supplied by the caller).

## Tokens
Declared in `src/components/gantt/tokens.ts`, registered as `gantt` in `cunningham.ts`, emitted as `--c--components--gantt--<name>` by `yarn build-theme`. Contextual and global tokens only.

| Token | Value | Light resolved |
|---|---|---|
| `background-color` | `contextuals.background.surface.secondary` | white |
| `header-background-color` | `contextuals.background.surface.tertiary` | gray-025 |
| `color` | `contextuals.content.semantic.neutral.primary` | gray-850 |
| `color--muted` | `contextuals.content.semantic.neutral.secondary` | gray-600 |
| `border-color` | `contextuals.border.surface.primary` | gray-100 |
| `border-width` | `1px` | literal (gap 2) |
| `row-background-color--hover` | `contextuals.background.semantic.neutral.tertiary` | gray-050 |
| `bar-background-color` | `contextuals.background.semantic.brand.primary` | brand-550 |
| `bar-border-color` | `contextuals.border.semantic.brand.primary` | brand-550 |
| `bar-radius` | `4px` | literal (gap 2; Button radius) |
| `bar-height` | `1.25rem` | literal (gap 3) |
| `row-height` | `2.5rem` | literal (gap 3), 40px |
| `task-column-width` | `16rem` | literal (gap 3) |
| `day-width--day` / `--week` / `--month` | `2.5rem` / `0.75rem` / `0.25rem` | literals (gap 4) |
| `today-color` | `contextuals.content.semantic.error.tertiary` | error-tertiary (red) |
| `today-width` | `2px` | literal (gap 2) |
| `padding` | `globals.spacings.sm` | 0.75rem, task cell |
| `focus-ring-color` | `contextuals.content.semantic.brand.tertiary` | brand-550 (not `border.semantic.brand.primary`: it fails 3:1 on the tertiary hover background in the three dark themes, as found in s11) |
| `focus-ring-width` | `2px` | literal (gap 2) |
| `focus-ring-offset` | `-2px` | literal (gap 2): inside the row |

BEM classes: `c__gantt`, `__toolbar`, `__zoom`, `__scroller`, `__axis`, `__axis-tier`, `__axis-label`, `__row`, `__task`, `__track`, `__bar`, `__today`, `__empty`; state through attributes (`[data-no-dates]`, `[data-today]`). No literal colour, spacing or radius in `index.scss`. Contrast of the bar (>= 3:1 vs `surface.secondary` and the row hover) and of the ring (>= 3:1 vs surface and hover) is checked numerically in the six themes in the plan (technique of `button/focus-ring.spec.tsx`); the today colour is checked against the axis background.

## Dark theme and the six themes
All colours are contextual tokens, so dark/DSFR/ANCT follow without per-theme code. The bar's `brand.primary` background is dark-theme-validated by contrast check, not assumed. The hover tint and the sticky column both use opaque tokens (never `rgba`) so a scrolling bar never shows through the task name.

## Responsive behaviour
Fluid width inside the consumer's container; the box scrolls on both axes, the task column shrinks to `min(16rem, 40%)` below the tablet breakpoint (never below 8rem). The zoom toolbar wraps. No breakpoint-specific layout otherwise; the consumer sets the block-size (default `max-height: 100%` of a sized parent; documented).

## Accessibility contract (RGAA / WCAG 2.2)
- **Role proposal: `grid`.** `div role="grid" aria-label={…} aria-rowcount={n+1} aria-colcount="2"`; header `role="row"` (aria-rowindex 1) with `columnheader` "Task" and `columnheader` "Schedule" (axis); each task `role="row"` (`aria-rowindex` = index + 2) with a `rowheader` (the task name) and a `gridcell` (the track, containing the bar). Rationale: matches "navigate rows, read name and dates" and keeps a single DOM row per task; `treegrid` is reserved for a future hierarchy; `listbox` implies selection and `option`s; `list` has no keyboard model. To confirm by the owner.
- **Row = focus unit (roving tabindex)**: one row `tabindex="0"`, the others `-1`. `Tab` enters the chart on the current row (first row initially) and the next `Tab` leaves it; `ArrowDown`/`ArrowUp` move to the next/previous row (no wrap); `Home`/`End` the first/last task row; `preventDefault` only when focus moved; the handler acts only when the event comes from a row (not from the zoom buttons, not from future inner controls, matters for s23).
- **Name and dates**: the focused row's accessible name is composed: `aria-label` = "{name}, from {start} to {end}" (dates formatted with `Intl.DateTimeFormat` for the active locale, long month, e.g. "Rédiger le cahier, du 3 mars 2026 au 10 mars 2026" in French); one-day task: "{name}, {date}"; no dates: "{name}, no dates". The bar itself is `aria-hidden="true"` (not a second announcement); the visible task name is not duplicated for AT because the row label carries it. Today is not announced per row (decorative marker, `aria-hidden`), but `aria-describedby` is not used.
- Zoom buttons: group `role="group"` with `aria-label`, `aria-pressed`; keyboard Tab/Enter/Space natively; the zoom is the only other tab stop.
- Visible focus ring >= 3:1, surviving forced colors; row height 40px.
- No information by colour alone: today = line + label; bars have a border; no-dates = text.
- `prefers-reduced-motion` removes zoom animation; nothing depends on motion.
- Storybook a11y addon reports no violation on every story (`grid` required-children/`aria-required-children` checks apply: header row and task rows must be direct children of the grid or a `rowgroup`; the plan tests the DOM structure).

## i18n (keys to add, same five locales: de-DE, en-US, es-ES, fr-FR, nl-NL)
Under `components.gantt`:
| Key | English | French |
|---|---|---|
| `zoom_aria_label` | Zoom level | Niveau de zoom |
| `zoom_day` | Day | Jour |
| `zoom_week` | Week | Semaine |
| `zoom_month` | Month | Mois |
| `task_column` | Task | Tâche |
| `schedule_column` | Schedule | Planning |
| `row_dates_aria` | {name}, from {start} to {end} | {name}, du {start} au {end} |
| `row_date_aria` | {name}, {date} | {name}, le {date} |
| `row_no_dates_aria` | {name}, no dates | {name}, sans dates |
| `no_dates` | No dates | Sans dates |
| `today` | Today | Aujourd'hui |
| `empty` | No tasks | Aucune tâche |
Dates inside the keys are pre-formatted by `Intl` (locale from the provider), never hand-built. The grid's own name is a required `aria-label` prop from the consumer.

## Forward compatibility (s23 move/resize, s24 dependencies)
The API and DOM reserve, without implementing:
- `GanttTask.id` required and stable; array order = row order; the component never mutates the data (controlled), so `onTaskChange(id, {start, end})` (s23) and `onDependencyChange` (s24) are additive props.
- `GanttTask` is an extendable interface (`dependsOn?`, `isReadOnly?` are later optional fields); `GanttZoom` exported; the scale util exposes `dayWidth` and `positionOf`, from which the inverse (pixel → date, snap to the zoom unit) is a one-liner for s23.
- Bar is a stable node `.c__gantt__bar[data-task-id]` in the row's gridcell, where s23 adds handles and pointer/keyboard handlers (row remains the focus unit; Alt/Shift+arrows are free in s22, which only handles plain arrows and Home/End, and ignores events with modifier keys so s23 can claim them).
- A positioned, empty overlay slot (`.c__gantt__links`, `position: absolute; inset: 0; pointer-events: none`) is **not** added now (YAGNI); the track coordinate system (origin at the first axis day, 1 day = `--gantt-day-width`) is the contract s24 draws in.
- `aria-rowcount`/`aria-rowindex` and the row's accessible-name composition are the extension point for s24's "dependencies listed for assistive technology" (a suffix of the label).

## Design system gaps
Reported, **not** filled by invention; resolved by reusing existing values, the owner confirms at the plan checkpoint.
1. **No time-scale / Gantt pattern in the system**: built from contextual tokens; no comparable component.
2. **Border width, focus-ring width/offset, bar radius, today width are not global tokens** (component literals, as Card/Accordion): `1px`, `2px`, `-2px`, `4px`.
3. **No global size tokens for row height, bar height, column width**: literals `2.5rem`, `1.25rem`, `16rem`.
4. **No "pixels per day" / zoom-scale token**: `day-width--day|week|month` literals `2.5rem|0.75rem|0.25rem`.
5. **No data-visualisation colour scale** (per-task/status colours): one brand bar colour only; per-status colours are out of scope until the system defines them (s47-chart may).
6. **No segmented-control / toggle-group component**: the zoom uses three `Button`s with `aria-pressed`; a real `ToggleButtonGroup` is a future component (not invented here).
