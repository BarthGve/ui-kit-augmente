import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

// Values copied verbatim from the stylesheet (docs/designs/s07-filters-update.md)
// so the rendered popover is unchanged. The item weight has a global ref but
// stays literal to keep the computed value identical; the sizes have no
// global token (design-system gaps).
export const tokens = (_defaults: DefaultTokens) => ({
  "popover-min-width": "240px",
  "popover-max-width": "320px",
  "search-height": "36px",
  "list-max-height": "240px",
  "item-min-height": "32px",
  "item-font-weight": "500",
  "message-padding": "8px",
  "user-row-gap": "16px",
});
