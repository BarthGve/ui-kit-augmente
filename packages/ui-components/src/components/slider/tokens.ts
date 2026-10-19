import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  return {
    "track-height": defaults.globals.spacings.xs,
    "track-color": defaults.contextuals.background.semantic.neutral.secondary,
    "track-border-radius": defaults.globals.spacings.xs,
    "fill-color": defaults.contextuals.background.semantic.brand.primary,
    "thumb-size": defaults.globals.spacings.md,
    "thumb-color": defaults.contextuals.background.surface.primary,
    "thumb-border-width": "2px",
    "thumb-border-color": defaults.contextuals.border.semantic.brand.primary,
    "thumb-shadow": "0 1px 3px 0 rgba(0, 0, 18, 0.2)",
    "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
    "focus-ring-width": "2px",
    "focus-ring-offset": "2px",
    "disabled-color": defaults.contextuals.content.semantic.disabled.primary,
    "label-color": defaults.contextuals.content.semantic.neutral.primary,
    "font-size": defaults.globals.font.sizes.sm,
  };
};
