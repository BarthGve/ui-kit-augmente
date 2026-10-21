import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  gap: defaults.globals.spacings.sm,
  "control-size": defaults.globals.spacings.lg,
  "controls-gap": defaults.globals.spacings.xs,
  "indicator-size": defaults.globals.spacings.xs,
  "indicator-color": defaults.contextuals.border.semantic.neutral.tertiary,
  "indicator-color--current":
    defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
  "focus-ring-offset": "2px",
});
