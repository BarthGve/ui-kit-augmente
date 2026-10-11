# Review — s24-gantt-dependencies / t04-gantt-link-keyboard

Branch verified: `feature/s24-gantt-dependencies/t04-gantt-link-keyboard`. Diff: `git diff next...HEAD` (Gantt.tsx, Gantt.spec.tsx, e2e/gantt/gantt.spec.tsx, 5 locales, plan and design notes).

## Run myself
- `yarn test --concurrency=1`: 43 files, 882 tests green. `yarn lint`: 0 errors (94 pre-existing warnings). `yarn check-locales`: aligned. `yarn build`: green.
- CT `e2e/gantt` (throwaway chromium-headless-shell config, port 21772, deleted along with `playwright/.cache` and `test-results`): 45/45 green, including the 3 keyboard tests.
- `cunningham-tokens-sass.scss` was rewritten by the build and restored with git. `cunningham-tokens*` is identical to `next`. Worktree is clean apart from the review file.

## Verification of the code
- References are real: `checkLink`, `refusalText`, `hasBar`, `listen`, `KEYS`, `LinkPair`, `taskOf` exist. The i18n keys `link_tip_target`, `announce_link_added`, `announce_link_removed` and `announce_link_cancelled` already exist.
- `onDependencyChange` is called in exactly one place for the keyboard path (`applyKeyLink`), after `closeLink()`, with `kind: "remove"` when the pair already exists and `"add"` otherwise. A refused candidate (cycle, no dates, self) only calls `showCandidate`: the session stays open and nothing is reported. Escape, window blur, row blur and unmount all go through `cancelLink()` or `unlisten`, and none of them reports.
- `preventDefault` is only called on consumed keys. Without `canLink`, without `altKey && shiftKey`, with Ctrl or Meta, with a session already open, or on a dateless row, `onLinkKey` returns false before `preventDefault`. Inside a session, any modified key returns false. The handler only runs when the target is a task row, so no text input is hijacked. Alt+Arrow and Shift+Arrow (s22/s23) stay with `onEditKey`: it returns false when a session is open and it is not a key edit. Plain arrows during a link session move the candidate and never leave the row.
- Cross-session guards: pointer link/move/resize starts check `session.current` (lines 1224, 1236) and the key link start checks it too. `close()` now skips sessions without a `bar`, so the pointer handlers ignore a `KeyLink`.
- Candidate logic (`firstCandidate`, `pickCandidate`): I traced Home/End/Up/Down at the edges and next to the source. The source is skipped and the index stays clamped. A single-task grid returns false, so no `preventDefault`. If the source or candidate disappears, Enter cancels cleanly. Everything is bounded by the task count.
- i18n: 3 keys in 5 locales, parity checked. Affordances (`aria-keyshortcuts`, `aria-describedby`, instructions element) only with `canLink`, which includes `!rtl`. No data from the caller is mutated. No token added.
- Plan: tasks 1-5 are done and the deviations are declared (`onLinkKey` separate, `source` field). The design update is consistent with the code.

## Mutations (jsdom `Gantt.spec.tsx`, 147 tests, restored after each, `git diff --exit-code` clean)
| Mutation | Red |
|---|---|
| kind add/remove swapped | 5 |
| refused candidate applied (guard removed) | 1 |
| `canLink` gate removed | 2 |
| row blur no longer cancels the key link | 1 |
| source not skipped | 1 |
| modifier guard in a session removed | 1 |
| one-session guard (`session.current`) removed | 5 |
| unmount cleanup removed | 5 |
| cancel also reports `onDependencyChange` | 4 |

Every central invariant is covered by at least one test that bites. The declared "equivalent mutation" (candidate-change guard) was removed, which is fine. The claim stands for the live region: an identical sentence leaves it unchanged.

## Findings
- **minor** — Enter on a refused candidate is silent for screen readers. The sentence was already announced when the candidate was selected, and the tip stays visible; `showCandidate` re-sets the same text, which a live region does not re-announce. AC3 ("refused with a message") is met at selection time and is visible. Optional improvement: re-announce on Enter, for example by appending a trailing space or toggling the text.
- **minor** — The candidate row is never scrolled into view (the s23 navigation does `scrollIntoView` for its bar). A sighted keyboard user in a long chart can pick a row they do not see; the live region says it anyway. A follow-up could add `scrollIntoView({block:"nearest"})` on the candidate.
- **minor** — The comment on `showCandidate` ("called only when it changes") is inaccurate: it runs on every key and relies on the live-region dedupe. Reword it.
- **minor** — Declared and accepted for t04: no `removing` style, no candidate outline for a valid candidate (SCSS out of scope). The cue is the tip and the live region.

No critical or major finding.

## Not verified (human gestures)
- Alt+Shift+Arrow in a real Windows or Linux browser. Windows Alt+Shift toggles the keyboard layout and may clash; Option+Shift on macOS produces characters, and `keydown` `key` can differ. Try it with several layouts installed.
- VoiceOver, NVDA and JAWS: the actual announcements, the double or silent live region on a refusal, and whether `aria-keyshortcuts` is read.
- The Storybook a11y addon run is declared by the author (axe, 12 runs, 0 violations). I did not repeat it.
- The artifact update and the PR line `Artifact: updated (version <id>)` are left to the main agent; I only note it. WebKit and Firefox CT were not run (chromium only). The s23 end-handle-24px CT test was green here.

Max severity: minor
Ship allowed: yes
