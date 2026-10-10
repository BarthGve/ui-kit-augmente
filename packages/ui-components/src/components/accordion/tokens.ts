import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  color: defaults.contextuals.content.semantic.neutral.primary,
  "color--disabled": defaults.contextuals.content.semantic.disabled.primary,
  "border-color": defaults.contextuals.border.surface.primary,
  // Literals below: no global token exists (design-system gaps 2 and 3);
  // border and ring widths reused from Card, offset inside the row.
  "border-width": "1px",
  "trigger-background-color--hover":
    defaults.contextuals.background.semantic.neutral.tertiary,
  "trigger-font-weight": defaults.globals.font.weights.bold,
  "trigger-padding": defaults.globals.spacings.base,
  "panel-padding": defaults.globals.spacings.base,
  "icon-size": "1.5rem",
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
  "focus-ring-offset": "-2px",
});
