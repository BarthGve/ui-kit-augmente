import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "title-color": defaults.contextuals.content.semantic.neutral.primary,
  "title-font-weight": defaults.globals.font.weights.bold,
  "description-color": defaults.contextuals.content.semantic.neutral.secondary,
  "media-color": defaults.contextuals.content.semantic.neutral.tertiary,
  padding: defaults.globals.spacings.xl,
  gap: defaults.globals.spacings.sm,
  "actions-gap": defaults.globals.spacings.xs,
  // Literals below: no global token exists (design-system gap 2).
  "media-size": "3rem",
  "description-max-width": "28rem",
});
