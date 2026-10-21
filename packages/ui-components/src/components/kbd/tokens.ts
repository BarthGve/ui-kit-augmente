import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  "font-size": defaults.globals.font.sizes.xs,
  color: defaults.contextuals.content.semantic.neutral.secondary,
  "background-color": defaults.contextuals.background.semantic.neutral.tertiary,
  "border-color": defaults.contextuals.border.semantic.neutral.tertiary,
  "border-width": "1px",
  "border-radius": defaults.globals.spacings["3xs"],
  "padding-inline": defaults.globals.spacings.xs,
  "min-width": defaults.globals.spacings.md,
  gap: defaults.globals.spacings["3xs"],
  "separator-color": defaults.contextuals.content.semantic.neutral.tertiary,
});
