import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  gap: defaults.globals.spacings["3xs"],
  color: defaults.contextuals.content.semantic.neutral.primary,
  "font-size": defaults.globals.font.sizes.sm,
  "item-padding-block": defaults.globals.spacings.xs,
  "item-padding-inline": defaults.globals.spacings.base,
  "item-border-radius": defaults.globals.spacings["3xs"],
  "item-hover-background-color":
    defaults.contextuals.background.semantic.neutral["secondary-hover"],
  "current-color": defaults.contextuals.content.semantic.brand.secondary,
  "current-indicator-color": defaults.contextuals.border.semantic.brand.primary,
  "current-indicator-width": "2px",
  "panel-background-color": defaults.contextuals.background.surface.primary,
  "panel-border-color": defaults.contextuals.border.surface.primary,
  "panel-border-width": "1px",
  "panel-border-radius": defaults.globals.spacings.xs,
  "panel-padding": defaults.globals.spacings.base,
  "panel-min-width": "14rem",
  "panel-box-shadow": "0 6px 20px 0 rgba(0, 0, 18, 0.1)",
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
});
