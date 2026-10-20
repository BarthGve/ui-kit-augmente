import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  gap: defaults.globals.spacings.md,
  "item-gap": defaults.globals.spacings.sm,
  "legend-font-size": defaults.globals.font.sizes.lg,
  "legend-font-weight": defaults.globals.font.weights.bold,
  "progress-height": defaults.globals.spacings.xs,
  "progress-track-color":
    defaults.contextuals.background.semantic.neutral.secondary,
  "progress-fill-color": defaults.contextuals.background.semantic.brand.primary,
  "progress-border-radius": defaults.globals.spacings.xs,
  "text-border-color": defaults.contextuals.border.semantic.neutral.tertiary,
  "text-border-width": "1px",
  "text-border-radius": defaults.globals.spacings.xs,
  "text-padding": defaults.globals.spacings.sm,
  "text-font-size": defaults.globals.font.sizes.md,
  "error-color": defaults.contextuals.content.semantic.error.primary,
  "error-border-color": defaults.contextuals.border.semantic.error.primary,
  "actions-gap": defaults.globals.spacings.sm,
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
});
