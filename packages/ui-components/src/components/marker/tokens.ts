import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  color: defaults.contextuals.content.semantic.neutral.tertiary,
  "font-size": defaults.globals.font.sizes.xs,
  gap: defaults.globals.spacings.xs,
  "padding-block": defaults.globals.spacings.xs,
  "padding-inline": defaults.globals.spacings.sm,
  "border-color": defaults.contextuals.border.semantic.neutral.tertiary,
  "border-width": "1px",
  "border-radius": defaults.globals.spacings.md,
  "rule-color": defaults.contextuals.border.surface.primary,
  "rule-width": "1px",
});
