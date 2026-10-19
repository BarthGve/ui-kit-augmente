import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => {
  return {
    gap: defaults.globals.spacings["3xs"],
    "padding-block": defaults.globals.spacings["3xs"],
    "padding-inline": defaults.globals.spacings["3xs"],
    "separator-margin-inline": defaults.globals.spacings["3xs"],
    "separator-min-height": defaults.globals.spacings.md,
  };
};
