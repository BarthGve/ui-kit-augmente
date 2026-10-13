# Design — Story s08-share-modal-update

Design system: `docs/design-system.md` (Share: modal, access, invitation, import). Reference: ui-kit #203 (Figma 11920-6169; related #187). **No mockup `.html`: this plan proposes no visual change.** The approved #203 frame was not readable here (research, open question 1) and the capability it asks for, adding several people at once, is already in the code (research, fact 1).

## Decision
The shipped look of the share modal stays pixel-identical. The story delivers: the missing states as stories, a DOM guard test, and the literals moved to component tokens with unchanged values. No new component, no new global token, no new locale key, no class renamed (the 11 e2e specs select on them).

## States (stories, evidence for AC1)
| State | Story | Status |
|---|---|---|
| default | `Default` | exists |
| with invitations | new `WithInvitations` (pending invitations list, one per role) | new; `ShareModalExample` must accept `invitations` |
| empty | new `Empty` (no members, no invitations, no results) | new |
| import | `ImportContacts`, `ImportContactsFailure` (modal) and `Default` of `ImportModal` | exist |
New stories only reuse existing props; no new prop on `ShareModal`.

## Tokens (values copied from the stylesheets, none invented)
`--c--components--share-modal--*`: `search-icon-width` 24px, `search-icon-min-height` 32px, `search-icon-padding-top` 7px, `search-content-min-height` 40px, `search-main-min-width` 130px, `search-input-line-height` 22px, `link-gap` 8px, `link-description-font-size` 12px, `link-role-font-size` 13px, `link-select-height` 40px, `empty-text-max-width` 320px, `restricted-padding-block` 8px, `confirmation-line-height` 18px, `confirmation-width` 350px; `--c--components--share-member-item--radius` 10px; `--c--components--share-invitation--item-min-height` 24px, `item-line-height` 16px. Spacing and font fallbacks (`var(--c--globals--spacings--xs, 8px)`) lose the literal fallback; the globals exist. The `#555e74` fallback goes. Colours keep their contextual tokens. A literal with no matching global is a token with the same value, commented in `tokens.ts` as a design-system gap (as `users/menu/tokens.ts`), reported not filled.

## Interactions (unchanged, to be guarded by the e2e suites)
Search a person, select several, choose a role, invite; unknown email offers an invite action; pending invitations listed with role change and delete; members listed with role management; link settings (reach, role, copy link); restrict access with a confirmation modal; import contacts from a CSV.

## Deferred visuals (not in this story)
- Anything the #203 frame changes visually (to be compared once readable).
- Hiding the invitation mode (#151) and "ask for access" (#313): not in the PRD, need an amendment.

## Design system gaps
No component-level tokens exist for the share family; no radius global for the 10px member item radius. Reported, not filled.
