# Design — Story s24-gantt-dependencies

Behaviour and drawing layer on the existing `Gantt` (s22, s23), no new screen. Agent-derived from `docs/design-system.md`, `docs/designs/s22-gantt-read-only.md` and `docs/designs/s23-gantt-move-resize.md`; to be reviewed by the owner before planning. Contrast computed from `packages/ui-components/src/cunningham-tokens.css` (six themes: default, dark, dsfr-light, dsfr-dark, anct-light, anct-dark). Reference mockup: `docs/designs/s24-gantt-dependencies.html` (static, reference only, not code). Research: `docs/research/s24-gantt-dependencies.md`.

## Screen(s)
Same chart. Links are opt-in data (`dependencies`); link editing is opt-in behaviour (`editable` **and** `onDependencyChange`). Anatomy (week zoom, rows top to bottom, `>` is the arrowhead):

```
| Brief      |  [=======]--+                                  |  forward route: stub, vertical in the gap, arrow
| Build      |             +--->[=========]o                   |  o = connector (hover / row focus, editable)
| Review     |                      +-----...                  |
| Test       |   (U route when the successor starts too close or before)  |
```
- **Link** (`.c__gantt__link`, in the overlay `.c__gantt__links`, `aria-hidden`): 2px orthogonal line from the **right edge of the predecessor's bar** to the **left edge of the successor's bar**, ending in an arrowhead (8px triangle) pointing right into the successor. Two routes: *forward* (wide gap: vertical segment `lead` (12px) before the successor) and *U* (narrow gap or conflict: out to `gutter` (44px) past the predecessor end, along the line between the two rows, then in). At most five segments.
- **Casing**: a 1px halo in the page colour around the line, so the line stays visible where it crosses a bar (no existing colour is visible on the bar fill, see Tokens).
- **Connector** (`.c__gantt__connector`, aria-hidden, a child of the track, not of the bar): a 10px dot on the bar's end side, `end + 8px .. end + 32px` (24x24 hit area), page-colour fill and brand border; `cursor: crosshair`; shown on hover and `focus-within` of the row (like the grips) and while a link session runs; only when link editing is on. Narrow bars keep it (it lies outside the bar).
- **Conflict marker** (`.c__gantt__link-flag`, aria-hidden): a 16px round chip with "!" at the arrowhead end of a conflicting link; the line turns dashed and takes the conflict colour. Selected, the link shows the sentence in a tip (inside the successor's row).
- **Remove affordance**: selecting a link (click or tap on its middle segments; the end stubs are excluded) shows a **Remove link** button, 24x24 with an x glyph, in the successor row's track just left of the arrow, and moves focus to it.
- **Refusal message**: a tip (the s23 `.c__gantt__tip` chip, inside the target row) with the reason, an `invalid-color` outline on the target row's bar, and the same sentence in the live region. It stays until the next pointer down, key press or focus change (no timer).
- **Prospective link** while a session runs: the same renderer with `data-state="creating"` (drag outline colour, solid) to the candidate row's bar; with `data-state="removing"` (dashed) when the pair is already linked.
- No toolbar, no new column, no legend. The overlay is clipped to the visible track (it never paints over the sticky task column); links are not drawn in `dir="rtl"`.

## States
| State | Rendering |
|---|---|
| idle | `link-color` line (2px), casing, arrowhead; no connector (read-only, or `editable` without `onDependencyChange`) |
| idle (link editing on) | as above; the connector appears on hover or focus-within of a dated row |
| hover on a link | line becomes `link-selected-color`, 3px; `cursor: pointer` (link editing on) |
| selected | line `link-selected-color`, 3px, Remove button in the successor row, focus on it |
| creating (pointer) | source bar outlined (`drag-outline-color`), the candidate row highlighted by the prospective link and tip "Start {to} after {from}"; over nothing: tip "Drop on a task" on the source row |
| refused | tip with the reason and `invalid-color` outline on the target (text, not colour alone); release cancels and keeps the sentence visible |
| conflict | dashed line in `link-conflict-color`, marker chip, in addition to casing; while moving or resizing the line follows the preview and the conflict appears and disappears live |
| keyboard link session | the candidate row is outlined, the prospective link is drawn, live region announces the pair and the action (link or unlink); Enter applies, Escape cancels, focus leaving the row cancels |
| removed / added | the caller's new `dependencies` arrive; if it does not update, nothing appears or disappears (controlled) |
| no dates / outside the window | not drawn, still listed for assistive technology |
| reduced motion | the segment transition (shared with the bars on a zoom change) is removed |
| forced-colors | lines `CanvasText`, casing `Canvas`, selected `Highlight`, marker `Canvas` fill + `CanvasText` text and border, dashed stays dashed |
| touch | connector and Remove button are 24x24; `touch-action: none` on the connector only; no long press; far targets through the keyboard path (gap) |

## Tokens
Added to `src/components/gantt/tokens.ts` (`--c--components--gantt--*`), existing contextual/global tokens only; literals only where no global token exists (reported). Contrast min..max over the six themes (surfaces: `surface.secondary` = page; row hover = `background.semantic.neutral.tertiary`).

| Token | Value | Pair | Contrast |
|---|---|---|---|
| `link-color` | `content.semantic.neutral.secondary` | on `surface.secondary` | 6.43..11.86 |
| (same) | | on row hover | 5.65..8.69 |
| `link-selected-color` | `content.semantic.neutral.primary` | on `surface.secondary` | 13.29..15.23 |
| (same) | | on row hover | 9.77..13.41 |
| `link-conflict-color` | `content.semantic.error.tertiary` | on `surface.secondary` | 5.37..7.83 |
| (same) | | on row hover | 4.73..5.74 |
| `link-casing-color` | `background.surface.secondary` | against the bar fill (`brand.tertiary`) | 5.35..7.73 |
| `link-color` over the casing | | `neutral.secondary` on `surface.secondary` | 6.43..11.86 (same pair as line on page) |
| `connector-border-color` | `content.semantic.brand.tertiary` | on `surface.secondary` | 5.35..7.73 |
| (same) | | on row hover | 4.70..5.66 |
| `connector-background-color` | `background.surface.secondary` | (fill; the border carries the contrast) | n/a |
| `link-flag-background-color` | `content.semantic.error.tertiary` | marker chip | n/a |
| `link-flag-color` | `background.surface.secondary` | "!" on `link-flag-background-color` | 5.37..7.83 (text >= 4.5) |
| `link-width` | `2px` literal | design-system gap 2 | |
| `link-width--selected` | `3px` literal | gap 2 | |
| `link-gutter` | `2.75rem` literal | gap 2 | |
| `link-lead` | `0.75rem` literal | gap 2 | |
| `link-arrow-size` | `0.5rem` literal | gap 2 | |
| `link-hit-size` | `1.5rem` literal (WCAG 2.5.8; same value as `handle-hit-size`) | gap 3 | |

Existing tokens reused: `drag-outline-color`, `invalid-color`, `tooltip-*`, `focus-ring-*`, `border-width`, `row-height`, `day-width--*`, `bar-height`.
**Trap, measured:** a content token is not visible on the bar fill: `neutral.primary` 1.73..2.83, `neutral.secondary` 1.20..1.54, every `*.tertiary` 1.00..1.01. A link that crosses a bar is therefore drawn with the casing (>= 5.35 against the fill) and the conflict colour is never the only cue. If any pair above fails in a theme when recomputed with the emitted variables, the ticket stops and reports (s11 route); no colour is picked silently.

## Accessibility
- **Roles**: the overlay is `aria-hidden="true"`, no role, no focusable child. Rows keep `role="row"` and their stable `aria-label` (name + dates). The Remove button lives in the successor row's `gridcell` (the track), so the grid structure stays valid. The dependency list is a plain `<ul>` outside the grid.
- **Listing (AC5)**: per row, a visually-hidden element referenced by `aria-describedby` ("Starts after: ..., Required by: ..., Conflict with: ..."; at most 5 names then "+N"), present in read-only mode too and appended to the s23 instructions id when both apply; plus one visually-hidden list after the scroller, `aria-label` "Dependencies", one item per valid link, conflicts included.
- **Live region** (the existing `role="status"`): session start/candidate/apply/cancel/refusal, and `announce_conflict` appended to the s23 preview announcement only when the set of conflicts changes (not per pixel).
- **Hit areas**: connector 24x24, Remove button 24x24, link hit strip 24px wide (middle segments only, so the connector and the resize handle keep priority); all >= 24px (WCAG 2.5.8). The 24px strip of a vertical segment sits at `end + 32..56px` so it never overlaps the connector zone (`+8..+32`).
- **Keyboard**: `Alt+Shift+Right` (this task is the predecessor), `Alt+Shift+Left` (this task is the successor) on a focused, dated row; Up/Down/Home/End move the candidate; Enter links (or unlinks when the pair exists); Escape cancels; focus leaving the row cancels. `aria-keyshortcuts` gains the two chords and the instructions gain `link_instructions`, only when link editing is on. Alt+Shift chords are not used by s23.
- **No information by colour alone**: conflict = dashed shape + "!" chip + text (list, row description, tip when selected); refused = sentence; creating = outline + tip.
- **Gaps (WCAG 2.5.7)**: creating a link by pointer needs dragging (no click-to-arm); the keyboard path is the equivalent. Removing a link has a click path. Reported, not filled.
- **Forced colors, reduced motion, touch**: see States.

## i18n (keys to add under `components.gantt`, the five locales: de-DE, en-US, es-ES, fr-FR, nl-NL)
Names and dates are inserted pre-formatted (`Intl`, provider locale; name lists through `Intl.ListFormat`).
| Key | English | French |
|---|---|---|
| `dependencies_list_label` | Dependencies | Dépendances |
| `dependency_item` | {from} must finish before {to} starts | {from} doit se terminer avant le début de {to} |
| `dependency_item_conflict` | {from} must finish before {to} starts. Conflict: {to} starts on {start}, {from} ends on {end} | {from} doit se terminer avant le début de {to}. Conflit : {to} commence le {start}, {from} se termine le {end} |
| `row_starts_after` | Starts after: {names} | Commence après : {names} |
| `row_required_by` | Required by: {names} | Requise par : {names} |
| `row_conflict` | Conflict with: {names} | Conflit avec : {names} |
| `names_more` | {names}, +{count} | {names}, +{count} |
| `link_instructions` | Alt plus Shift plus Right arrow makes another task start after this one; Alt plus Shift plus Left arrow makes this task start after another. Up and Down arrows choose the task, Enter links or unlinks, Escape cancels. | Alt plus Maj plus flèche droite fait commencer une autre tâche après celle-ci ; Alt plus Maj plus flèche gauche fait commencer cette tâche après une autre. Les flèches haut et bas choisissent la tâche, Entrée lie ou délie, Échap annule. |
| `link_remove` | Remove link from {from} to {to} | Supprimer le lien de {from} vers {to} |
| `link_tip_target` | Start {to} after {from} | Faire commencer {to} après {from} |
| `link_tip_drop` | Drop on a task | Déposer sur une tâche |
| `link_conflict_tip` | Conflict: {to} starts before {from} ends | Conflit : {to} commence avant la fin de {from} |
| `link_refused_cycle` | Not linked: this would create a loop | Lien refusé : il créerait une boucle |
| `link_refused_self` | A task cannot depend on itself | Une tâche ne peut pas dépendre d'elle-même |
| `link_refused_no_dates` | Not linked: {name} has no dates | Lien refusé : {name} n'a pas de dates |
| `announce_link_target` | Link {from} to {to}: {to} would start after {from} ends. Enter to link. | Lier {from} à {to} : {to} commencerait après la fin de {from}. Entrée pour lier. |
| `announce_link_exists` | {to} already starts after {from}. Enter to remove the link. | {to} commence déjà après {from}. Entrée pour supprimer le lien. |
| `announce_link_added` | {to} now starts after {from} | {to} commence désormais après {from} |
| `announce_link_removed` | Link removed: {to} no longer depends on {from} | Lien supprimé : {to} ne dépend plus de {from} |
| `announce_link_cancelled` | Link cancelled | Lien annulé |
| `announce_conflict` | Conflict: {to} starts before {from} ends | Conflit : {to} commence avant la fin de {from} |
No plural keys (no counts spoken except `+N`). `link_conflict_tip` and `announce_conflict` share the sentence on purpose (one string to translate per locale is acceptable to merge at implementation; keep both keys so the tip can change alone).

## Forward compatibility
- `GanttDependency` is `{ from, to }` today; a `type` or `lag` is additive. The renderer takes route segments from `links.ts`, so another link type changes one function.
- The overlay and the clip variable are the extension point for other decorations (baselines, milestones) which must also stay `aria-hidden`.
- Auto-scroll while linking and click-to-arm linking would reuse the link session unchanged.

## Design system gaps
Reported, not filled; resolved by existing values, owner confirms at the plan checkpoint.
1. **No connector/link/edge pattern, no "!" status chip** in the system: a plain dot and a plain chip drawn with existing colours.
2. **No global token for a 2px/3px line, the 44px/12px route gutters or the arrow size**: literals in `tokens.ts` (as `focus-ring-width`).
3. **No global size token for the 24px minimum target** (as in s23 gap 4).
4. **No delete/x icon decided for a small button inside a chart**: the existing icon set is used if one fits at 24px, else a text glyph; to confirm.
5. **No tooltip primitive that renders inside a clipped container** (s23 gap 3): the tip chip stays inside the row.
6. **No colour token that is visible on the bar fill**: the casing is a workaround, not a fix.
7. **No click-based alternative to dragging for creating a link** (2.5.7).
8. **Links are not drawn in right-to-left** (axis RTL out of scope since s22).
