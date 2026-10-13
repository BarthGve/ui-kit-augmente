import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "background-color": defaults.contextuals.background.surface.secondary,
  "header-background-color": defaults.contextuals.background.surface.tertiary,
  color: defaults.contextuals.content.semantic.neutral.primary,
  "color--muted": defaults.contextuals.content.semantic.neutral.secondary,
  "border-color": defaults.contextuals.border.surface.primary,
  "row-background-color--hover":
    defaults.contextuals.background.semantic.neutral.tertiary,
  // A content token: the brand backgrounds fall under 3:1 in the dark themes.
  "bar-background-color": defaults.contextuals.content.semantic.brand.tertiary,
  "bar-border-color": defaults.contextuals.content.semantic.brand.tertiary,
  "today-color": defaults.contextuals.content.semantic.error.tertiary,
  // Editing (s23): ghost of the original dates, outline and date chip.
  "ghost-border-color": defaults.contextuals.content.semantic.brand.tertiary,
  "drag-outline-color": defaults.contextuals.content.semantic.neutral.primary,
  "tooltip-background-color":
    defaults.contextuals.content.semantic.neutral.primary,
  "tooltip-color": defaults.contextuals.background.surface.secondary,
  // Resizing (s23): grips on the bar fill, outline of a clamped edit (never
  // a text colour: it fails on the tooltip chip).
  "handle-grip-color": defaults.contextuals.background.surface.secondary,
  "invalid-color": defaults.contextuals.content.semantic.error.tertiary,
  // Dependencies (s24): no content token shows on the bar fill, so a line
  // crossing a bar has a casing in the page colour; a conflict is also
  // dashed and flagged, never colour alone.
  "link-color": defaults.contextuals.content.semantic.neutral.secondary,
  "link-selected-color": defaults.contextuals.content.semantic.neutral.primary,
  "link-conflict-color": defaults.contextuals.content.semantic.error.tertiary,
  "link-casing-color": defaults.contextuals.background.surface.secondary,
  "link-flag-background-color":
    defaults.contextuals.content.semantic.error.tertiary,
  "link-flag-color": defaults.contextuals.background.surface.secondary,
  // Link editing: the connector dot, a page-colour fill in a brand ring.
  "connector-border-color":
    defaults.contextuals.content.semantic.brand.tertiary,
  "connector-background-color":
    defaults.contextuals.background.surface.secondary,
  padding: defaults.globals.spacings.sm,
  "focus-ring-color": defaults.contextuals.content.semantic.brand.tertiary,
  // Literals below: no global token exists (design-system gaps 2 to 4).
  "border-width": "1px",
  "bar-radius": "4px",
  "bar-height": "1.25rem",
  "row-height": "2.5rem",
  "task-column-width": "16rem",
  // Mirrored in px by `scale.ts` (DAY_WIDTH), checked by scale.spec.ts.
  "day-width--day": "2.5rem",
  "day-width--week": "0.75rem",
  "day-width--month": "0.25rem",
  "today-width": "2px",
  "focus-ring-width": "2px",
  "focus-ring-offset": "-2px",
  // The 24px minimum target (WCAG 2.5.8), checked against bar widths in
  // Gantt.tsx (HANDLE_MIN), and the grip line.
  "handle-hit-size": "1.5rem",
  "handle-grip-width": "2px",
  // Links: line widths, route offsets (mirrored in px by `links.ts` to choose
  // a route only, checked by links.spec.ts), arrowhead and hit strip.
  "link-width": "2px",
  "link-width--selected": "3px",
  "link-gutter": "2.75rem",
  "link-lead": "0.75rem",
  "link-arrow-size": "0.5rem",
  "link-hit-size": "1.5rem",
});
