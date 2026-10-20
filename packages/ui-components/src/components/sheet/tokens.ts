import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  return {
    width: "28rem",
    height: "50vh",
    "background-color": defaults.contextuals.background.surface.secondary,
    color: defaults.contextuals.content.semantic.neutral.primary,
    "border-color": defaults.contextuals.border.surface.primary,
    "border-width": "1px",
    padding: defaults.globals.spacings.md,
    gap: defaults.globals.spacings.base,
    "title-font-size": defaults.globals.font.sizes.md,
    "title-font-weight": defaults.globals.font.weights.bold,
    "box-shadow": "0 6px 20px 0 rgba(0, 0, 18, 0.1)",
    duration: "0.25s",
    distance: "2rem",
  };
};
