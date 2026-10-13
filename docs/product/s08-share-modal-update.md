# Updated share modal — `s08-share-modal-update`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

People who share a document invite several people at once, choose their access, copy the link and import contacts from one modal. This story makes the modal's states provable and its styling themable, without changing how it looks.

## User flow

1. Open the share modal.
2. Search a person, select several, choose a role, invite.
3. Review pending invitations and current members, change a role or remove access.
4. Set the link access, copy the link, or import contacts from a file.

## Visible rules

- The modal looks and behaves as before; nothing moves on screen.
- Every state has a Storybook story: default, with invitations, empty, import.
- Spacing, sizes and radii come from component tokens, so an application can theme them (`--c--components--share-modal--*`).

## Known limits

- The design of upstream issue #203 was not readable during framing; if it differs from the current look, that is a separate story.
- Hiding the invitation mode (#151) and "ask for access" (#313) are not part of this story.

## Out of scope

- New props on `ShareModal`.
- Any visual redesign.
