import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  return {
    "font-size": defaults.globals.font.sizes.s,
    gap: defaults.globals.spacings.xs,
    color: defaults.contextuals.content.semantic.neutral.secondary,
    "current-color": defaults.contextuals.content.semantic.neutral.primary,
    "link-color": defaults.contextuals.content.semantic.neutral.secondary,
    "separator-color": defaults.contextuals.content.semantic.neutral.tertiary,
    "border-radius": defaults.globals.spacings["3xs"],
    "focus-ring-color": defaults.contextuals.content.semantic.brand.tertiary,
    "focus-ring-width": "2px",
    "focus-ring-offset": "2px",
  };
};
