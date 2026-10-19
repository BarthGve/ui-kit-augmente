import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  gap: defaults.globals.spacings.xs,
  color: defaults.contextuals.content.semantic.neutral.primary,
  "font-size": defaults.globals.font.sizes.sm,
  "trigger-padding": defaults.globals.spacings.xs,
  "trigger-border-radius": defaults.globals.spacings["3xs"],
  "icon-size": defaults.globals.spacings.md,
  "hover-background-color":
    defaults.contextuals.background.semantic.neutral["secondary-hover"],
  "disabled-color": defaults.contextuals.content.semantic.disabled.primary,
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
  "focus-ring-offset": "2px",
  duration: "0.2s",
});
