import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  width: "16rem",
  "width--collapsed": "4rem",
  "background-color": defaults.contextuals.background.surface.secondary,
  "border-color": defaults.contextuals.border.surface.primary,
  "border-width": "1px",
  color: defaults.contextuals.content.semantic.neutral.primary,
  "font-size": defaults.globals.font.sizes.sm,
  padding: defaults.globals.spacings.sm,
  gap: defaults.globals.spacings.base,
  "item-gap": defaults.globals.spacings.xs,
  "item-padding-block": defaults.globals.spacings.xs,
  "item-padding-inline": defaults.globals.spacings.sm,
  "item-border-radius": defaults.globals.spacings["3xs"],
  "item-hover-background-color":
    defaults.contextuals.background.semantic.neutral["secondary-hover"],
  "current-background-color":
    defaults.contextuals.background.semantic.brand.secondary,
  "current-color": defaults.contextuals.content.semantic.brand.secondary,
  "group-label-color": defaults.contextuals.content.semantic.neutral.tertiary,
  "icon-size": defaults.globals.spacings.md,
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
  duration: "0.2s",
});
