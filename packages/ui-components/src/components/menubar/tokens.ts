import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "background-color": defaults.contextuals.background.surface.primary,
  "border-color": defaults.contextuals.border.surface.primary,
  "border-width": "1px",
  "border-radius": defaults.globals.spacings.xs,
  gap: defaults.globals.spacings["3xs"],
  padding: defaults.globals.spacings["3xs"],
  color: defaults.contextuals.content.semantic.neutral.primary,
  "font-size": defaults.globals.font.sizes.sm,
  "item-padding-block": defaults.globals.spacings.xs,
  "item-padding-inline": defaults.globals.spacings.sm,
  "item-border-radius": defaults.globals.spacings["3xs"],
  "item-hover-background-color":
    defaults.contextuals.background.semantic.neutral["secondary-hover"],
  "item-open-background-color":
    defaults.contextuals.background.semantic.brand.secondary,
  "item-disabled-color": defaults.contextuals.content.semantic.disabled.primary,
  "item-danger-color": defaults.contextuals.content.semantic.error.primary,
  "menu-min-width": "12rem",
  "box-shadow": "0 6px 20px 0 rgba(0, 0, 18, 0.1)",
  "shortcut-margin": defaults.globals.spacings.base,
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
});
