import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  gap: defaults.globals.spacings.sm,
  "meta-gap": defaults.globals.spacings.xs,
  "author-font-weight": defaults.globals.font.weights.bold,
  "font-size": defaults.globals.font.sizes.xs,
  "time-color": defaults.contextuals.content.semantic.neutral.tertiary,
  "actions-gap": defaults.globals.spacings["3xs"],
  "transition-duration": "0.15s",
});
