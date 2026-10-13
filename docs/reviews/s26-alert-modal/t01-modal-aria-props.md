# Review s26-alert-modal / t01-modal-aria-props

Branch verified: feature/s26-alert-modal/t01-modal-aria-props. Diff: `git diff next...HEAD`.

## Checks run
- `yarn lint`: green. `yarn check-locales`: aligned.
- `yarn test --concurrency=1`: 37 files, 588 tests, all passed (full suite, after the last typing fix).
- `yarn build`: green (tsc included). `cunningham-tokens-sass.scss` restored; tree clean.
- `git diff next -- modal/index.spec.tsx`: empty (0 lines). AC6: existing spec unchanged and green.
- react-modal 3.16.3 (installed): `ModalPortal.js` renders `role: this.props.role` and spreads `aria` via `attributesFromObject("aria", {modal: true, ...props.aria})`; `Modal.js` `defaultProps.role = "dialog"`. So `role={undefined}` keeps `dialog`, `aria-modal` stays true, and undefined aria entries are not written. The API used exists.
- Types: three props added to `ModalBaseProps`; both union variants inherit them; tsc passes.

## Plan vs diff
Tasks 1-5 done; no drift. Files: index.tsx, new modal-aria.spec.tsx, story, changeset. `ModalProvider` and pre-built modals untouched. Defaults unchanged when props are absent.

## Mutations (restored, `git diff --exit-code` clean)
- aria-label guard removed (contentLabel always computed): 1 red.
- `role` forwarding dropped: 2 red.
- `aria` object emptied: 1 red.
All three invariants bite. Tests assert behavior (roles, accessible name and description, absence of aria-label), not decoration.

## Findings
- Minor: the guard treats an empty-string `aria-labelledby` as absent (falsy). Harmless.
- Minor: the commit message differs from the changeset line (cosmetic, as announced).
- No security, factorization or design-system issue (no style or token change).

## Not verified
- Axe results in 3 themes (default, dark, dsfr-light) and the Escape behavior of the `AlertDialogRole` story: not re-run (no Storybook/browser session started); the implementer's report is taken as a claim. A human should open the story in the 3 themes and run an axe pass.
- Design-system artifact (version 1791570208-119f): cannot be opened from here. The human must confirm the Modal page lists the three props, and the PR must carry `Artifact: updated (version 1791570208-119f)`.
- Screen-reader announcement of `alertdialog` (VoiceOver/NVDA): not checked.

Max severity: minor
Ship allowed: yes
