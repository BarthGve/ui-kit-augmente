import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  return {
    gap: defaults.globals.spacings.base,
    "input-border-color": defaults.contextuals.border.semantic.neutral.tertiary,
    "input-border-radius": defaults.globals.spacings["3xs"],
    "input-padding": defaults.globals.spacings.xs,
    "input-font-size": defaults.globals.font.sizes.sm,
    "input-color": defaults.contextuals.content.semantic.neutral.primary,
    "input-border-color--invalid":
      defaults.contextuals.border.semantic.error.primary,
    "valid-color": defaults.contextuals.content.semantic.success.primary,
    "invalid-color": defaults.contextuals.content.semantic.error.primary,
    "summary-color": defaults.contextuals.content.semantic.neutral.secondary,
    "summary-font-size": defaults.globals.font.sizes.sm,
  };
};
