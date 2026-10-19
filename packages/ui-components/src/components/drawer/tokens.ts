import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  return {
    "border-radius": defaults.globals.spacings.md,
    "handle-width": "2.5rem",
    "handle-height": defaults.globals.spacings.xs,
    "handle-color": defaults.contextuals.border.semantic.neutral.tertiary,
    "handle-padding": defaults.globals.spacings.sm,
    "box-shadow": "0 -6px 20px 0 rgba(0, 0, 18, 0.1)",
    duration: "0.2s",
  };
};
