import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  const content = defaults.contextuals.content.semantic;
  return {
    height: "5px",
    "border-radius": "15px",
    "min-width": "1px",
    "track-color": defaults.contextuals.background.semantic.neutral.secondary,
    "fill-color": content.neutral.secondary,
    "warning-color": content.warning.secondary,
    "error-color": content.error.secondary,
  };
};
