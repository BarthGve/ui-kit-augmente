# Updated app switcher and user menu — `s06-waffle-user-menu`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

The app switcher (`LaGaufreV2`) and the user menu (`UserMenu`) are documented and tested in every state. Their colours, radii and spacing come from tokens, so they follow the theme.

## User flow

1. Select the waffle button to open the app switcher, or the avatar to open the user menu.
2. Move through the content with Tab. The user menu keeps focus inside.
3. Press Escape to close. Focus goes back to the button.

## Visible rules

- The waffle button label is translated in the five supported languages.
- The user menu opens with Enter or Space. It is 272 px wide.
- Without a user, the user menu shows nothing.
- Focus on a menu item shows a ring inside the item.
- The app switcher panel is provided by a remote widget (`widgetPath`). Its size, scroll and loading are the widget's.

## Out of scope

- The look of the remote widget panel.
- Changes to the props of `LaGaufre`, `LaGaufreV2` or `UserMenu`.
- A shared shadow scale for menus and modals.
