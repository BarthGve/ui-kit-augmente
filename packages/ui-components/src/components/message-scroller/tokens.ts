import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  gap: defaults.globals.spacings.sm,
  padding: defaults.globals.spacings.base,
  "jump-offset": defaults.globals.spacings.base,
  "jump-box-shadow": "0 2px 8px 0 rgba(0, 0, 18, 0.15)",
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
});
