import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  return {
    "background-color": defaults.contextuals.background.surface.tertiary,
    "border-radius": defaults.globals.spacings.xs,
    padding: defaults.globals.spacings["3xs"],
    gap: defaults.globals.spacings["3xs"],
    "font-size": defaults.globals.font.sizes.s,
    "font-weight": "500",
    color: defaults.contextuals.content.semantic.neutral.secondary,
    "padding-block": defaults.globals.spacings.xs,
    "padding-inline": defaults.globals.spacings.base,
    "option-border-radius": defaults.globals.spacings["2xs"],
    "hover-background-color":
      defaults.contextuals.background.semantic.neutral["secondary-hover"],
    "selected-background-color":
      defaults.contextuals.background.surface.primary,
    "selected-color": defaults.contextuals.content.semantic.neutral.primary,
    "disabled-color": defaults.contextuals.content.semantic.disabled.primary,
    "small-font-size": defaults.globals.font.sizes.xs,
    "small-padding-block": defaults.globals.spacings["3xs"],
    "small-padding-inline": defaults.globals.spacings.sm,
    "focus-ring-color": defaults.contextuals.content.semantic.brand.tertiary,
    "focus-ring-width": "2px",
    "focus-ring-offset": "2px",
  };
};
