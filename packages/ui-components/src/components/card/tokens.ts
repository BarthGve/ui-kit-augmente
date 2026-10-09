import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  "background-color": defaults.contextuals.background.surface.secondary,
  "background-color--hover":
    defaults.contextuals.background.semantic.neutral.tertiary,
  color: defaults.contextuals.content.semantic.neutral.primary,
  "border-color": defaults.contextuals.border.surface.primary,
  // Literals below: no global token exists (design-system gaps 1 and 2);
  // values reused from Calendar (border, shadow), Modal (radius), Tabs (ring).
  "border-width": "1px",
  "border-radius": "8px",
  "box-shadow": "0 2px 4px rgba(0, 0, 0, 0.05)",
  padding: defaults.globals.spacings.base,
  "header-font-weight": defaults.globals.font.weights.bold,
  "focus-ring-color": defaults.contextuals.border.semantic.brand.primary,
  "focus-ring-width": "2px",
  "focus-ring-offset": "2px",
});
