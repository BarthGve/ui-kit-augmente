import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  return {
    gap: defaults.globals.spacings.sm,
    "font-size": defaults.globals.font.sizes.sm,
    color: defaults.contextuals.content.semantic.neutral.tertiary,
    "current-color": defaults.contextuals.content.semantic.neutral.primary,
    "marker-size": defaults.globals.spacings.md,
    "marker-gap": defaults.globals.spacings.xs,
    "marker-font-size": defaults.globals.font.sizes.xs,
    "marker-background-color":
      defaults.contextuals.background.semantic.neutral.secondary,
    "marker-color": defaults.contextuals.content.semantic.neutral.secondary,
    "done-marker-background-color":
      defaults.contextuals.background.semantic.brand.secondary,
    "done-marker-color": defaults.contextuals.content.semantic.brand.secondary,
    "current-marker-background-color":
      defaults.contextuals.background.semantic.brand.primary,
    "current-marker-color":
      defaults.contextuals.content.semantic.brand["on-brand"],
  };
};
