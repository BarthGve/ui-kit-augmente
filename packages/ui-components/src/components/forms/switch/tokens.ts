import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "accent-color": defaults.contextuals.content.semantic.brand.tertiary,
  "rail-background-color":
    defaults.contextuals.content.semantic.neutral.tertiary,
  "rail-background-color--disabled":
    defaults.contextuals.content.semantic.disabled.primary,
  "rail-border-radius": "50vw",
  "handle-background-color":
    defaults.contextuals.content.semantic.contextual.primary,
  "handle-background-color--disabled":
    defaults.contextuals.content.semantic.disabled.secondary,
  "handle-border-radius": "50%",
  // Small size. Keep `small-rail-height` >= 14px: with the label's 4px padding
  // and 1px border, that keeps the hit area >= 24x24 (WCAG 2.5.8).
  "small-rail-width": "2rem",
  "small-rail-height": "1rem",
  "small-handle-size": "0.75rem",
  "small-handle-offset": defaults.globals.spacings["4xs"],
});
