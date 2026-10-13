# Design — Story s23-gantt-move-resize

Behaviour layer on the existing `Gantt` (s22), no new screen. Agent-derived from `docs/design-system.md` and `docs/designs/s22-gantt-read-only.md`; to be reviewed by the owner before planning. Contrast values computed from `packages/ui-components/src/cunningham-tokens.css` (six themes). Reference mockup: `docs/designs/s23-gantt-move-resize.html` (static, reference only, not code).

## Screen(s)
Same anatomy as s22. Editing is opt-in (`editable`, default `false`). Added to a dated task's row in editing mode:

```
| Build        |  .. ........[|=== Build ===|]........         |  ghost (dashed) = original place
|              |        [|=====bar=====|]   "Mar 9 to Apr 3"   |  tooltip beside the bar, inside the row
```
- **Bar** (`.c__gantt__bar`, still `aria-hidden`): the move surface. `cursor: grab`, `grabbing` while dragging.
- **Edge handles** `.c__gantt__handle[data-edge="start|end"]` inside the bar: two grips (2px vertical lines, `surface.secondary` on the bar fill), `cursor: ew-resize`. Hit area: full row height (>= 40px) x `handle-hit-size` (1.5rem = 24px) wide, centred on the bar edge and extending 8px outside it (transparent), so the target meets WCAG 2.5.8 (24px) without a wider bar. Below 72px bar width each handle shrinks to a third of the bar; below 24px (month zoom, short tasks) handles are not drawn and pointer resize is unavailable at that zoom (zoom in, or keyboard). Gap reported.
- **Ghost** `.c__gantt__ghost`: dashed outline (shape, not colour) at the original place while a session runs; no fill.
- **Date tooltip** `.c__gantt__tip` (`aria-hidden`; the live region announces): "{start} to {end}", drawn **inside the row**, beside the dragged bar (end side, flipped to the start side when it would cross the track end), never a floating popover: rows use `content-visibility: auto`, which clips paint outside the row. Inverted colours (dark chip on light, light chip on dark).
- No new control, no toolbar change, no drag-handle icon on the row.

## States
| State | Rendering |
|---|---|
| idle (`editable`) | as s22; the bar has `cursor: grab`; handles hidden until hover/focus-within of the row so a static chart stays calm |
| idle (read-only, default) | exactly s22: `cursor: default`, no handles, no ghost, no tooltip, no instructions |
| hover on bar | edge handles appear (grips); `cursor: grab` on the body, `ew-resize` on a handle |
| keyboard focus on a row | s22 ring on the row; handles shown (same trigger as hover) so the affordance is discoverable; instruction text exposed to AT only |
| dragging (move) | `data-editing="move"`; bar follows in whole zoom units (jumps, no tween: the bar `transition` is off during a session), outline `focus-ring-width` solid `drag-outline-color`, `cursor: grabbing`, ghost at original place, tooltip with new dates; `user-select: none` on the grid |
| resizing | same, `data-editing="resize-start|resize-end"`, `cursor: ew-resize`; only the dragged edge moves |
| invalid (clamped) | end dragged before start: the bar stays at 1 unit (start == end), outline `invalid-color`, tooltip text "The end cannot be before the start" (text, not colour alone); same for the axis edge ("limit of the chart") |
| cancelled | Escape / pointercancel / blur / lost capture: bar returns to the original place at once (no tween), ghost and tooltip removed, live region "change cancelled", no callback |
| keyboard session | Alt/Shift+Arrow: same preview as a drag (outline, ghost, tooltip) without cursor; Enter commits, Escape cancels, focus leaving the row cancels |
| committed | preview cleared in the render where the caller's new `tasks` arrive; if the caller does not update, the bar is back at the original place (controlled contract) |
| no dates / clipped by the window | no bar, no handles, not editable |
| reduced motion | nothing animates in a session anyway; the s22 zoom transition rule stays; auto-scroll is user driven and kept |
| forced-colors | bar `Highlight` / `CanvasText` border (s22), drag outline `Highlight`, ghost border `CanvasText` dashed, grips `CanvasText`, tooltip `Canvas` bg + `CanvasText` text + 1px border, invalid outline `Highlight` + the text |
| touch | `touch-action: none` on the bar and handles only (fingers on the track or the task cell still scroll); no long-press; cancel on `pointercancel` |

## Tokens
Added to `src/components/gantt/tokens.ts` (same file, `--c--components--gantt--*`), existing contextual/global tokens only; literals only where no global token exists (reported). Contrast measured in default, dark, dsfr-light, dsfr-dark, anct-light, anct-dark.

| Token | Value | Pair | Contrast (min..max over the six themes) |
|---|---|---|---|
| `ghost-border-color` | `contextuals.content.semantic.brand.tertiary` | on `surface.secondary` | 5.36..7.73 |
| (same) | | on `neutral.tertiary` (row hover) | 4.70..5.66 |
| `handle-grip-color` | `contextuals.background.surface.secondary` | on the bar fill (`bar-background-color`) | 5.35..7.73 |
| `drag-outline-color` | `contextuals.content.semantic.neutral.primary` | on `surface.secondary` | > 13 (text colour on its own surface) |
| `invalid-color` | `contextuals.content.semantic.error.tertiary` | on `surface.secondary` | 5.37..7.83 |
| (same) | | on `neutral.tertiary` | 4.73..5.74 |
| `tooltip-background-color` | `contextuals.content.semantic.neutral.primary` | with the text below | |
| `tooltip-color` | `contextuals.background.surface.secondary` | on the tooltip background | 13.29..15.23 |
| `handle-hit-size` | `1.5rem` | literal (gap 2) | 24px target |
| `handle-grip-width` | `2px` | literal (gap 3), same family as `focus-ring-width` | |

Reused unchanged: `bar-*`, `focus-ring-*`, `border-width`, `bar-radius`, `row-height`, `padding`, `today-color` (not reused for invalid: separate token on the same value so they can diverge). **Not usable, recorded:** error colour as text on the tooltip background fails (1.71..2.83), so the invalid cue on the tooltip is the sentence, and the colour only appears on the bar outline. `border.semantic.brand.primary` is not used (it failed 3:1 on hover in dark themes in s11 and s22). The tests recompute all pairs; if one is red from the start the implementer stops and reports (s11 route), never picks a colour silently.

BEM additions: `__handle`, `__ghost`, `__tip`, `__live` (visually hidden), state through `[data-editing]`, `[data-edge]`, `[data-clamped]`, `[data-clipped]`. No literal colour, spacing or radius in `index.scss`.

## Reused components
`VisuallyHidden` from `react-aria` (live region and instruction text). Nothing else; no `Tooltip` component (RAC `Tooltip` is a hover/focus popover on a trigger, rendered in a portal: wrong semantics and clipped by row containment), no `Icon`.

## Responsive behaviour
No layout change. Below the tablet breakpoint the 40% task column (s22) leaves less track; bars shrink with the zoom; handles follow the width rules above. Auto-scroll thresholds are in px, relative to the visible track (the scroller width minus the sticky column).

## Accessibility contract (RGAA / WCAG 2.2)
- **Operability is on the row**, which already is the focus unit. The bars remain `aria-hidden` (no second tab stop, no hidden-focusable conflict; handles are never focusable). All pointer functions have a keyboard equivalent on the row (2.1.1): move by Alt+Left/Right, end by Shift+Left/Right, start = move then end.
- **Semantics for the affordance**: no new role (a `row` of a `grid` keeps its role). When `editable`, a dated row gets `aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Shift+ArrowLeft Shift+ArrowRight Enter Escape"` and `aria-describedby` -> a `VisuallyHidden` instruction (`edit_instructions`). Rows without dates get neither. The row's `aria-label` (name + dates, s22) does not change during a session.
- **Live region**: one `role="status"` (polite) per `Gantt`, visually hidden. Messages: session start (keyboard), the new dates when the snapped step **changes** (not per pixel; for a drag only the settled value is announced on release if the user moves fast, i.e. throttled to 300ms), limit reached, commit, cancel. Dates through `Intl` (locale from the provider). Message queue is replaced, never stacked.
- **Targets**: handles >= 24x24 CSS px (row height 40px x 24px hit area) except where the bar is too narrow (reported gap; keyboard path exists). Bar body is 20px high inside a 40px row: the draggable zone is the full row height of the bar's columns (hit area taller than the painted bar).
- **Keyboard interplay**: Up/Down/Home/End unchanged and ignored while a session is open (they do not leave the row mid-edit; the session is cancelled if focus moves anyway). Alt+Left/Right `preventDefault` (history back/forward on Windows/Linux). Escape `stopPropagation` while a session runs (does not close an enclosing Modal).
- **Pointer**: single-pointer drag has no path-based alternative needed beyond the keyboard (2.5.1 is about multipoint/path gestures; drag is a dragging movement, 2.5.7 asks for a single-pointer alternative without dragging: the keyboard covers keyboard users, but a **pointer-only user without keyboard has no click-based alternative**). Reported gap; proposed follow-up, not in this story (a "edit dates" dialog or click-to-pick is a new component).
- No information by colour alone: ghost = dashed shape, drag = outline + tooltip, invalid = sentence.
- Forced colors and reduced motion: see States.

## i18n (keys to add under `components.gantt`, the five locales: de-DE, en-US, es-ES, fr-FR, nl-NL)
| Key | English | French |
|---|---|---|
| `edit_instructions` | Alt plus Left or Right arrow moves the task by one step of the zoom. Shift plus Left or Right arrow changes its end date. Enter confirms, Escape cancels. | Alt avec flèche gauche ou droite déplace la tâche d'un pas du zoom. Maj avec flèche gauche ou droite modifie sa date de fin. Entrée valide, Échap annule. |
| `tooltip_dates` | {start} to {end} | du {start} au {end} |
| `announce_preview` | {name}: {start} to {end} | {name} : du {start} au {end} |
| `announce_changed` | {name} rescheduled: {start} to {end} | {name} replanifiée : du {start} au {end} |
| `announce_cancelled` | {name}: change cancelled, dates restored | {name} : modification annulée, dates rétablies |
| `limit_end_before_start` | The end cannot be before the start | La fin ne peut pas précéder le début |
| `limit_axis` | Limit of the chart reached | Limite du graphique atteinte |
Dates are pre-formatted by `Intl` and inserted; a one-day task uses the existing `row_date_aria` form for `{start}` equal to `{end}` (collapsed on the component side, not in the key). No plural key is needed (no day count shown).

## Forward compatibility (s24 dependencies)
- The session state (`id`, `start`, `end`, `mode`) is the single place s24's "conflict when the order would be broken" reads from; the preview carries `clamped`. Do not move dependents automatically (s24 note).
- The row label suffix extension point of s22 is untouched; the instruction text is a separate `aria-describedby`.
- Handles and ghost live inside `.c__gantt__track` and use the same coordinate system (origin = first axis day); s24's SVG overlay can draw over them (`pointer-events: none` on the overlay).

## Design system gaps
Reported, not filled; resolved by existing values, owner confirms at the plan checkpoint.
1. **No drag-and-drop / resize pattern, no drag affordance (grip) in the system.** Two grips drawn with an existing colour.
2. **No elevation / shadow token** for a lifted element, so dragging is shown by an outline.
3. **No tooltip primitive that renders inside a clipped container**; a plain chip is used.
4. **No global size token for the 24px minimum target** (`handle-hit-size` literal) nor 2px grip width.
5. **No visually-hidden utility class in the library**: `VisuallyHidden` from `react-aria` (already a dependency) is reused.
6. **No click-based alternative to dragging** for a pointer-only user (WCAG 2.5.7); would need a new "edit dates" component.
7. **Narrow bars cannot carry 24px handles** (month zoom).
