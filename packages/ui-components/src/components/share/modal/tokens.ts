import { DefaultTokens } from "@gouvfr-lasuite/ui-tokens";

// Values are those the stylesheets carried as literals. Entries marked
// "design-system gap" have no global to point at: they keep the literal value.
export const tokens = (defaults: DefaultTokens) => {
  return {
    "border-width": "1px", // design-system gap
    "member-item--border-radius": "10px", // design-system gap
    "search-field--icon-width": "24px", // design-system gap
    "search-field--icon-min-height": "32px", // design-system gap
    "search-field--icon-padding-top": "7px", // design-system gap
    "search-field--content-min-height": "40px", // design-system gap
    "search-field--main-space-min-width": "130px", // design-system gap
    "search-field--input-line-height": "22px", // design-system gap
    "search-field--actions-min-height": "40px", // design-system gap
    "link-settings--gap": defaults.globals.spacings.xs,
    "link-settings--description-font-size": "12px", // design-system gap
    "link-settings--select-height": "40px", // design-system gap
    "link-settings--role-font-size": "13px", // design-system gap
    "cannot-view--max-width": "320px", // design-system gap
    "restricted--padding-block": defaults.globals.spacings.xs,
    "confirmation--width": "350px", // design-system gap
    "confirmation--line-height": "18px", // design-system gap
    "user-item--min-height": "24px", // design-system gap
    "user-item--line-height": "16px", // design-system gap
  };
};
