import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  gap: defaults.globals.spacings.sm,
  padding: defaults.globals.spacings.sm,
  "small-padding": defaults.globals.spacings.xs,
  "border-radius": defaults.globals.spacings.xs,
  color: defaults.contextuals.content.semantic.neutral.primary,
  "description-color": defaults.contextuals.content.semantic.neutral.tertiary,
  "title-font-size": defaults.globals.font.sizes.sm,
  "title-font-weight": defaults.globals.font.weights.medium,
  "description-font-size": defaults.globals.font.sizes.xs,
  "outlined-border-color": defaults.contextuals.border.surface.primary,
  "outlined-border-width": "1px",
  "muted-background-color":
    defaults.contextuals.background.semantic.neutral.tertiary,
  "hover-background-color":
    defaults.contextuals.background.semantic.neutral["secondary-hover"],
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
  "group-gap": defaults.globals.spacings["3xs"],
});
