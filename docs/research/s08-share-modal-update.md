# Research — Story s08-share-modal-update

Worktree `.worktrees/s08-share-modal-update`, branch `feature/s08-share-modal-update`, base `next` at `5fc69bff`. Docs only; nothing built or run (no test executed in this research). Sources read: `components/share/**` (modal, import-modal, access, users-invitation, utils), `e2e/share-modal/`, `e2e/share-import-modal/`, the three `*.stories.tsx`, `docs/research/s07-filters-update.md`, upstream issue ui-kit #203 (`gh api`).

## The five structuring facts
1. **The "update" of #203 is already in the code.** The issue asks for "ergonomic enhancement of the sharing modal to support adding multiple users" (related #187, contact import). `ShareModal` already has multi-selection (`search.selectedUsers`, `ShareModal.tsx:128,146`), a unified search field (`UnifiedSearchField` story, `share-modal.stories.tsx:220`), and the import modal (`ImportContacts` story, `:242`). No visible gap to build.
2. **No design is available in the repo.** `docs/designs/` has no s08 file; the only design is the image in upstream #203 (Figma link, not reachable here). Not read by this research. An agent cannot match a design it has not seen: open question 1.
3. **The state list of AC1 is only partly true.** Stories exist for default (`Default`, `:166`), import (`ImportContacts`, `ImportContactsFailure`, `:242,252`) and 17 more variants. "With invitations" has no story: `ShareModalExample` passes `invitations={[]}` (`share-modal.stories.tsx:210`), and `InvitationItem` exists only as an isolated item in `share-items.stories.tsx:22`. "Empty" (no members, no invitations) has no named story.
4. **No snapshot test can be stateful.** The repo has no `__snapshots__`; two vitest copies make `toMatchInlineSnapshot` stateless (`docs/research/s07-filters-update.md:45`). The honest guard, as in s05/s06/s07, is an exact DOM string with ids normalised. The share components have no Vitest spec at all (only `utils.test.ts`, `useShareSearch.test.ts`); behaviour is covered by 11 Playwright specs (1711 lines).
5. **The stylesheet has 25 literal values and no component tokens.** `share-modal.scss`: `24px`, `32px`, `7px`, `130px`, `22px`, `12px`, `13px`, `40px`, `320px`, `18px`, `8px`, a hex fallback `#555e74` (`:75`), and `--c--components--modal--width-small: 350px` (`:233`, a definition, not a use); `items/index.scss:5` `border-radius: 10px`; `users-invitation/index.scss:31,36` `24px`, `16px`. Many `var(--c--globals--spacings--xs, 8px)` carry literal fallbacks that are tolerated by the grep but are literals. No `--c--components--share-*` token exists in `cunningham.ts`. AC1's second half is real work.

## Target story
**As a** user sharing a document **I want** the updated share modal **so that** I invite people and set their access clearly. Complexity 3.
- AC1: Storybook story per state (default, with invitations, empty, import), each covered by a snapshot test; every colour, spacing and radius from a token, no literal in the stylesheet.
- AC2: invitation, role selection, link copying and import keep working (existing tests pass).
- Dependencies: none. Out of scope: hide invitation mode (#151), ask for access (#313).

## Current state of the code
- `modal/`: `ShareModal.tsx` (263 lines) composes `ShareSearchField`, `ShareSearchResults`, `ShareInvitationsSection`, `ShareMembersSection`, `ShareLinkSettings` (242), `ShareModalFooter`; `share-modal.scss` (260). Hooks `useShareSearch`, `useShareImport`, `useShareModalLayout`.
- `import-modal/`: `ShareImportModal.tsx` (185), `import-modal.scss` (5 lines), `utils.ts` + test.
- `access/AccessRoleDropdown.tsx`, `users-invitation/InvitationUserSelectorList.tsx` (+ scss), `utils/ShareModalCopyLinkFooter.tsx`.
- Stories: `modal/stories/share-modal.stories.tsx` (459 lines, 19 stories) with `ShareModalExample.tsx`; `import-modal/share-import-modal.stories.tsx` (1: `Default`); `modal/items/share-items.stories.tsx` (6 items); `access/access-role-dropdown.stories.tsx` (2).
- E2E: `share-modal/` 9 specs, `share-import-modal/` 2 specs, helper `helpers/mount-share-modal`.

## Anchor points
- Stories to add: `share-modal.stories.tsx` (+ `ShareModalExample.tsx` to take `invitations` and `members`).
- Stylesheets to tokenise: `modal/share-modal.scss`, `modal/items/index.scss`, `users-invitation/index.scss`, `import-modal/import-modal.scss` (clean), `access/index.scss` (clean).
- Tokens: `packages/ui-components/cunningham.ts` then `yarn build-theme` (never edit `src/cunningham-tokens.*`). Pattern: a `tokens.ts` beside the component, as in `components/users/menu/tokens.ts`.
- Guard test: a new Vitest `ShareModal.spec.tsx` next to the modal (exact DOM string, ids normalised, as `UserMenu.spec.tsx`).

## Verified APIs / functions
- `ShareModal` throws without `invitationRoles` (`ShareModal.tsx:42`) and without `onInviteUser` unless `hideInvitations` (`:49`).
- `ShareModalProps` (`modal/types.ts`): `searchUsersResult`, `onInviteUser(users, role)`, `invitationRoles`, `invitations`, members list, link settings.
- `ShareModalExample` hard-codes `invitations={[]}` (`:210`).

## Traps & constraints
- The 11 e2e specs assert on class names and text: renaming a BEM class breaks them. Keep class names; change only values.
- Replacing a literal with a token must not change the rendered pixel (AC2, "existing tests pass"). `--c--globals--spacings--*` have values; check each literal against the generated `src/cunningham-tokens.css` (not done here).
- `#555e74` is a fallback of `--c--contextuals--content--semantic--neutral--secondary`; the fallback can go if the variable is always defined (theme loaded).
- The a11y Storybook check and `yarn check-locales` apply; no new user-visible text is planned.
- Artifact rule: the design-system artifact must be updated in the ticket (component page, catalogue entry, `project/canvas.json`) and the PR carries `Artifact: updated (version <id>)`.

## Open questions
1. **Design.** The Figma frame of #203 is unreachable and the image is not read. Is the current look the approved one? Default if no answer: no visual change, only tokens and states (the s07 precedent).
2. **"Empty" state.** No members and no invitations, or no search results? Default: no members and no invitations.
3. **"Import" state.** Import modal open (`ImportContacts`) is enough, or the import modal alone too? Default: both exist, keep.
4. **Which tokens?** Spacing literals map to existing globals; sizes (`24px`, `40px`, `320px`) and `10px` radius have no global. Default: component tokens `--c--components--share-modal--*` in a `tokens.ts`.

## Real complexity
Scored 3 in `docs/stories.md`; **my score is 3**, same number, different content. The UI work is small (no new behaviour, #203 already shipped in code). The cost sits in the tokenisation (25 literals across 3 sheets, visual parity to prove) and in a guard test for a 263-line composite with no Vitest spec. A premise is partly false (fact 1, fact 3): the story is repaired in the plan, not patched.

## Split proposal
Not required (verdict 3). If the design in #203 differs from the current look, that part is a separate story, not a ticket of this one.
