import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  size: defaults.globals.spacings.xs,
  "thumb-color": defaults.contextuals.border.semantic.neutral.tertiary,
  "thumb-hover-color": defaults.contextuals.content.semantic.neutral.tertiary,
  "track-color": "transparent",
  "thumb-border-radius": defaults.globals.spacings.xs,
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
});
