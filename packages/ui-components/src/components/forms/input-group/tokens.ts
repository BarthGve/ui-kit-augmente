import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "border-color": defaults.contextuals.border.semantic.neutral.tertiary,
  "border-width": "1px",
  "border-radius": defaults.globals.spacings.xs,
  "background-color": defaults.contextuals.background.surface.primary,
  "focus-border-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "1px",
  "error-border-color": defaults.contextuals.border.semantic.error.primary,
  "success-border-color": defaults.contextuals.border.semantic.success.primary,
  "disabled-background-color":
    defaults.contextuals.background.semantic.neutral.tertiary,
  "disabled-color": defaults.contextuals.content.semantic.disabled.primary,
  "addon-color": defaults.contextuals.content.semantic.neutral.tertiary,
  "addon-padding": defaults.globals.spacings.sm,
  "addon-gap": defaults.globals.spacings.xs,
  "control-color": defaults.contextuals.content.semantic.neutral.primary,
  "font-size": defaults.globals.font.sizes.md,
  "min-height": "3rem",
});
