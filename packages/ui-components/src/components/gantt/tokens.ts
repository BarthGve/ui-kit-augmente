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
});
