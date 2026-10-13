# Alert modal — `s26-alert-modal`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`AlertModal` interrupts the user with an important message and asks them to acknowledge it or decide.

## User flow

1. Open the modal, for example from a button.
2. Read the title and the message, which screen readers announce on open.
3. Choose the primary action, or dismiss.

## Visible rules

- It is a modal dialog with the `alertdialog` role, named by its title and described by its message.
- `severity` is `info`, `success`, `warning` or `error`. It adds an icon and colours the primary action. Without it, the alert is neutral.
- Focus goes to the primary action on open. With `error`, or without a primary action, it goes to the dismiss action.
- Focus stays inside and returns to the opener on close.
- Escape and the dismiss action call `onClose`.
- A click outside does not close it, unless `closeOnClickOutside` is set.
- The primary action does not close the modal. Close it yourself.
- There is no close button.
- Default labels ("Ok", "Cancel") are translated in the five languages. Title and message are yours.
- `size` is `default` or `sm`. `details` and `media` are optional.
- It must be inside `CunninghamProvider`.
- Existing modals are unchanged.

## Out of scope

- A helper such as `useModals().alertModal()`.
- Auto-dismiss.
- A close "X" button.
