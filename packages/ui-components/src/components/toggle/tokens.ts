import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "border-radius": defaults.globals.spacings.xs,
  "border-width": "1px",
  "border-color": defaults.contextuals.border.semantic.neutral.tertiary,
  color: defaults.contextuals.content.semantic.neutral.secondary,
  "hover-background-color":
    defaults.contextuals.background.semantic.neutral["secondary-hover"],
  "pressed-background-color":
    defaults.contextuals.background.semantic.brand.secondary,
  "pressed-color": defaults.contextuals.content.semantic.brand.secondary,
  "pressed-indicator-color": defaults.contextuals.border.semantic.brand.primary,
  "pressed-indicator-width": "2px",
  "disabled-color": defaults.contextuals.content.semantic.disabled.primary,
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
  "focus-ring-offset": "2px",
  gap: defaults.globals.spacings.xs,
  "padding-inline": defaults.globals.spacings.base,
  "padding-block": defaults.globals.spacings.xs,
  "font-size": defaults.globals.font.sizes.sm,
  "small-padding-inline": defaults.globals.spacings.sm,
  "small-padding-block": defaults.globals.spacings["3xs"],
  "nano-padding-inline": defaults.globals.spacings.xs,
  "nano-padding-block": defaults.globals.spacings["4xs"],
  "nano-font-size": defaults.globals.font.sizes.xs,
});
