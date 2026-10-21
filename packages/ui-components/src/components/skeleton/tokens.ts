import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  return {
    "background-color":
      defaults.contextuals.background.semantic.neutral.secondary,
    "highlight-color":
      defaults.contextuals.background.semantic.neutral["secondary-hover"],
    "border-radius": defaults.globals.spacings["3xs"],
    "line-height": defaults.globals.spacings.base,
    "block-height": defaults.globals.spacings["6xl"],
    duration: "1.5s",
  };
};
