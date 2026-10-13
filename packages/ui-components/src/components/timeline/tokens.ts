import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  color: defaults.contextuals.content.semantic.neutral.primary,
  "color--muted": defaults.contextuals.content.semantic.neutral.secondary,
  "color--current": defaults.contextuals.content.semantic.brand.primary,
  "connector-color": defaults.contextuals.border.surface.primary,
  "marker-done-background":
    defaults.contextuals.border.semantic.success.primary,
  "marker-done-color": defaults.contextuals.content.semantic.success["on-success"],
  "marker-current-background":
    defaults.contextuals.border.semantic.brand.primary,
  "marker-upcoming-border-color":
    defaults.contextuals.content.semantic.neutral.tertiary,
  "title-font-weight": defaults.globals.font.weights.regular,
  "title-font-weight--current": defaults.globals.font.weights.bold,
  gap: defaults.globals.spacings.base,
  "item-gap": defaults.globals.spacings.xs,
  "focus-ring-color": defaults.contextuals.content.semantic.brand.tertiary,
  // Literals below: no global token exists (design-system gaps 2 and 3);
  // widths reused from Card, marker size is Material Icons' base 24px.
  "connector-width": "2px",
  "marker-size": "1.5rem",
  "marker-border-width": "2px",
  "item-min-width": "12rem",
  "focus-ring-width": "2px",
  "focus-ring-offset": "2px",
});
