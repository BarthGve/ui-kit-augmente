import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "background-color": defaults.contextuals.background.surface.primary,
  color: defaults.contextuals.content.semantic.neutral.primary,
  "border-color": defaults.contextuals.border.surface.primary,
  "border-width": "1px",
  "border-radius": defaults.globals.spacings.xs,
  "box-shadow": "0 6px 20px 0 rgba(0, 0, 18, 0.1)",
  padding: defaults.globals.spacings.base,
  width: "20rem",
  "viewport-margin": "2rem",
  "font-size": defaults.globals.font.sizes.sm,
});
