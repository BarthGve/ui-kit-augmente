// The native select reuses the `forms-input` tokens (border, radius, focus
// ring); it only adds the room for its chevron.
import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "icon-size": defaults.globals.spacings.md,
  "padding-inline": defaults.globals.spacings.sm,
  "min-height": "3rem",
});
