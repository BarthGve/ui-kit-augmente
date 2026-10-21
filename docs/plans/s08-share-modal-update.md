---
validated: yes
---
# Plan — Story s08-share-modal-update

Branch: `feature/s08-share-modal-update` (framing) · tickets: `feature/s08-share-modal-update/<ticket-id>`
Research: `docs/research/s08-share-modal-update.md` read first. Design: `docs/designs/s08-share-modal-update.md`.

## Target story
**As a** user sharing a document **I want** the updated share modal **so that** I invite people and set their access clearly. Complexity 3 in stories.md, **3 after research**.

**The premises are partly false** (details in the research): the "adding several people" update of ui-kit #203 is already in the code; the state list of AC1 lacks two stories ("with invitations", "empty"); no snapshot or Vitest spec exists for the modal; the approved frame was not readable, so the plan proposes **no visual change**. The story is repaired as: missing states, a DOM guard, the literals moved to component tokens with unchanged values.

- AC1 Storybook story per state (default, with invitations, empty, import), each covered by a snapshot-like test (exact DOM string, ids normalised); every colour, spacing and radius from a token, no literal value in the stylesheet.
- AC2 Invitation, role selection, link copying and import keep working (existing tests pass).

## Tickets (ordered)

### t01-share-modal-state-guards
- **size:** M
- **estimate:** 2d
- **depends on:** none
- **scope:** stories and tests only. **No change to any `.tsx` of the modal, to the stylesheets or to the tokens**, except `modal/stories/ShareModalExample.tsx` (story helper) to accept `invitations` and `members`. New: `components/share/modal/ShareModal.spec.tsx` (jsdom), stories `WithInvitations` and `Empty` in `share-modal.stories.tsx`.

Tasks (the guard describes existing behaviour: green from the start, each proven able to fail by a mutation, reverted, recorded in the PR):
1. [ ] Stories first: `WithInvitations` (pending invitations, roles differ) and `Empty` (no members, no invitations, no results); `ShareModalExample` takes `invitations`/`members` props with the current defaults. Check the render in Storybook on the port from `bash .dm/lib/dm-port.sh` (never 6006), stop what you started.
2. [ ] `ShareModal.spec.tsx`: exact DOM strings (`react-aria\d+-…` ids normalised), `CunninghamProvider`, `TZ=UTC`, for default, with invitations, empty. Mutations: drop the invitations section, rename a `c__share-modal__*` class, drop the members title: red each.
3. [ ] Import state: a DOM guard for `ShareImportModal` in its initial state (the `ImportContacts` modal stays covered by the e2e specs). Mutation: rename a `c__share-import-modal` class, red.
4. [ ] `yarn lint`, `TZ=UTC yarn test`, `yarn check-locales`; the 11 share e2e specs run green on the worktree port (chromium).

### t02-share-modal-tokens
- **size:** M
- **estimate:** 1.5d
- **depends on:** t01
- **scope:** the literals of `modal/share-modal.scss`, `modal/items/index.scss`, `users-invitation/index.scss` moved to component tokens with **unchanged values**; no class renamed; no behaviour change. New: `components/share/modal/tokens.ts`, entry in `cunningham.ts`, `yarn build-theme`, one changeset. Artifact updated in this ticket (Share page, `Composants` catalogue entry, `project/canvas.json`); PR line `Artifact: updated (version <id>)`.

Tasks:
1. [ ] Red first: a Vitest check that reads the three stylesheets and fails on any literal length, hex or `rgba(` outside `var(...)` names (a new `tokens.spec.ts`, reusing the pattern of `users/menu` if one exists), failing on today's code with the 25 literals listed.
2. [ ] Add the tokens listed in the design (values copied, none invented); literal fallbacks in `var(--c--globals--…, 8px)` removed; the `#555e74` fallback removed; a literal with no global is a token with the same value, commented as a design-system gap in `tokens.ts`.
3. [ ] `yarn build-theme`; the guard from t01 and the 11 share e2e specs stay green with no edit; a computed-style comparison of the modal before and after (same width/height/padding of the search field, link settings and member item) recorded in the PR.
4. [ ] Update the design-system artifact (read the published index again before republishing and merge, never overwrite); changeset.

## US totals
- **Person-days:** 3.5 (2 + 1.5)
- **Size mix:** 2×M

## Run interdicts
- No new dependency, no new locale key, no public API or prop change on `ShareModal`, no generated file edited by hand (`src/cunningham-tokens.*`).
- No class renamed; the rendered pixel of the modal must not change.
- #151 (hide invitation mode) and #313 (ask for access) stay out.

## Files touched
- t01: `share/modal/stories/share-modal.stories.tsx`, `share/modal/stories/ShareModalExample.tsx`, `share/modal/ShareModal.spec.tsx` (new), `share/import-modal/ShareImportModal.spec.tsx` (new).
- t02: `share/modal/share-modal.scss`, `share/modal/items/index.scss`, `share/users-invitation/index.scss`, `share/modal/tokens.ts` (new), `cunningham.ts`, `share/modal/tokens.spec.ts` (new), `.changeset/*.md`.

## Test strategy
Vitest (jsdom) for exact DOM strings and the no-literal guard; mutation per guard; existing Playwright CT specs (chromium) as the behaviour proof; Storybook render and a11y check for the two new stories. CI `e2e` on the PR is the final proof on three engines.

## Definition of Done
Repo DoD. t01: stories, guards with mutations recorded, e2e green. t02: no literal left in the three sheets, rendered values unchanged, artifact line present, changeset added.
