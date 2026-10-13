import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

// Values copied verbatim from the stylesheet (docs/designs/s07-filters-update.md)
// so the rendered filter is unchanged. The weights and the font size have
// globals (rem or refs) but stay literal to keep the computed values
// identical; the other sizes have no global token (design-system gaps).
// `item-gap`, `popover-border-width` and `popover-radius` are three more
// literals of the same stylesheet.
export const tokens = (defaults: DefaultTokens) => ({
  "button-height": "32px",
  "button-radius": "4px",
  "button-border-width": "1px",
  "button-font-size": "14px",
  "button-font-weight": "400",
  "button-active-font-weight": "500",
  "button-gap": "6px",
  "button-padding": "0 6px 0 8px",
  "icon-size": "1.25rem",
  "item-gap": "6px",
  "popover-border-width": "1px",
  "popover-radius": "4px",
  "popover-padding": "8px",
  // s07 t04: the hover/focus label colour (`neutral.tertiary` measured 4.16:1
  // on the hover background in light themes) and the trigger focus ring,
  // width and offset literals as in Card.
  "button-color--hover":
    defaults.contextuals.content.semantic.neutral.secondary,
  "focus-ring-color": defaults.contextuals.content.semantic.brand.tertiary,
  "focus-ring-width": "2px",
  "focus-ring-offset": "2px",
});
