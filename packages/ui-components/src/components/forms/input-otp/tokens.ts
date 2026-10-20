import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "slot-size": "3rem",
  "slot-gap": defaults.globals.spacings.xs,
  "slot-border-width": "1px",
  "slot-border-radius": defaults.globals.spacings.xs,
  "slot-border-color": defaults.contextuals.border.semantic.neutral.tertiary,
  "slot-background-color": defaults.contextuals.background.surface.primary,
  "slot-color": defaults.contextuals.content.semantic.neutral.primary,
  "slot-font-size": defaults.globals.font.sizes.lg,
  "separator-color": defaults.contextuals.content.semantic.neutral.tertiary,
  "focus-border-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
  "error-border-color": defaults.contextuals.border.semantic.error.primary,
  "success-border-color": defaults.contextuals.border.semantic.success.primary,
  "disabled-color": defaults.contextuals.content.semantic.disabled.primary,
});
