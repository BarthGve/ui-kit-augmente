import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "background-color--hover":
    defaults.contextuals.background.semantic.neutral["tertiary-hover"],
  "background-color": defaults.contextuals.background.surface.primary,
  "font-size": defaults.globals.font.sizes.s,
  "font-weight": defaults.globals.font.weights.medium,
  color: defaults.contextuals.content.semantic.neutral.primary,
  "border-color": defaults.contextuals.content.semantic.neutral.tertiary,
  "border-color--hover": defaults.contextuals.content.semantic.neutral.tertiary,
  "border-color--focus": defaults.contextuals.content.semantic.brand.primary,
  "border-radius": "2px",
  "border-width": "1.5px",
  "border-width--hover": "1px",
  "accent-color": defaults.contextuals.content.semantic.brand.tertiary,
  "accent-color--disabled":
    defaults.contextuals.content.semantic.disabled.primary,
  "checkmark-color": defaults.contextuals.content.semantic.contextual.primary,

  size: "1.5rem",
  // Small size, shared with Radio. Keep `small-size` >= 14px: with the label's
  // 4px padding and 1px border, that keeps the hit area >= 24x24 (WCAG 2.5.8).
  "small-size": "1rem",
  "small-font-size": defaults.globals.font.sizes.xs,
});
