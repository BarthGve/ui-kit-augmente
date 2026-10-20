import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

// Colours and item styles are those of the select (`forms-select`).
export const tokens = (defaults: DefaultTokens) => ({
  "popover-max-height": "20rem",
  "popover-border-radius": defaults.globals.spacings.xs,
  "popover-shadow": "0 6px 20px 0 rgba(0, 0, 18, 0.1)",
  "list-padding": defaults.globals.spacings["3xs"],
  "option-padding-block": defaults.globals.spacings.xs,
  "option-padding-inline": defaults.globals.spacings.sm,
  "option-border-radius": defaults.globals.spacings["3xs"],
});
