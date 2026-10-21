import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  const bg = defaults.contextuals.background.semantic;
  const content = defaults.contextuals.content.semantic;
  return {
    "max-width": "80%",
    "padding-block": defaults.globals.spacings.xs,
    "padding-inline": defaults.globals.spacings.sm,
    "border-radius": defaults.globals.spacings.md,
    "font-size": defaults.globals.font.sizes.sm,
    gap: defaults.globals.spacings["3xs"],
    "default-background-color": bg.brand.primary,
    "default-color": content.brand["on-brand"],
    "secondary-background-color": bg.brand.secondary,
    "secondary-color": content.brand.secondary,
    "muted-background-color": bg.neutral.secondary,
    "muted-color": content.neutral.primary,
    "tinted-background-color": bg.info.secondary,
    "tinted-color": content.info.secondary,
    "outline-border-color":
      defaults.contextuals.border.semantic.neutral.tertiary,
    "outline-border-width": "1px",
    "ghost-color": content.neutral.primary,
    "destructive-background-color": bg.error.secondary,
    "destructive-color": content.error.secondary,
    "error-color": content.error.primary,
    "error-font-size": defaults.globals.font.sizes.xs,
    "reaction-background-color": bg.neutral.tertiary,
    "reaction-padding-inline": defaults.globals.spacings.xs,
    "reaction-border-radius": defaults.globals.spacings.md,
    "reaction-font-size": defaults.globals.font.sizes.xs,
    "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
    "focus-ring-width": "2px",
    "group-gap": defaults.globals.spacings["4xs"],
  };
};
