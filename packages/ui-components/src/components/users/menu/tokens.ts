import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

export const tokens = (defaults: DefaultTokens) => ({
  // Literals below: no global token exists (design-system gaps 1 and 2);
  // the shadow is Modal's, the radius Modal's and Card's, the ring Tabs'.
  width: "272px",
  "border-width": "1px",
  "border-radius": "8px",
  "box-shadow": "0 6px 20px 0 rgba(0, 0, 18, 0.10)",
  "item-gap": "1px",
  "item-border-radius": "4px",
  "focus-ring-color": defaults.contextuals.content.semantic.brand.tertiary,
  "focus-ring-width": "2px",
});
