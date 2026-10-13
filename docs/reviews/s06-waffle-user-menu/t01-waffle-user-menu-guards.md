# Review s06-waffle-user-menu / t01-waffle-user-menu-guards

Branch verified: feature/s06-waffle-user-menu/t01-waffle-user-menu-guards (one commit).

## Verified myself
- Production files byte-identical to next: `git diff next` on packages shows only 2 specs and 2 stories files (no tsx component, scss, locales, types, cunningham.ts, tokens). Artifact "not applicable" is correct: nothing user-visible changes. The plan diff only ticks tasks.
- `yarn test --concurrency=1`: 47 files, 954 tests green. `yarn lint`, `yarn check-locales` (aligned), `yarn build` green. cunningham-tokens-sass.scss rewritten by test/build, restored with git; tree clean. No vitest process left.
- Research claims: de-DE/es-ES/nl-NL `laGaufre.label` are translated (Digitale LaSuite-Dienste, Servicios digitales..., nl present and different). `CunninghamProvider` is exported from provider/Provider.tsx; provider/index.tsx only imports en-US and fr-FR, so the spec's import choice is right. Widget init keys in the spec match LaGaufreV2.tsx exactly (14 keys).
- No network: the remote script is never loaded in jsdom, `fetchMock` asserted not called in the closed test; stories with network (Open) are Storybook only.

## Mutations (production files, restored, `git diff --exit-code next` clean)
- half-viewport comparison flipped: 2 red
- `buttonElement` dropped: 2 red
- `laGaufre.label` read replaced by `title`: 7 red
- class `lagaufre-button` renamed: 1 red
- `aria-expanded` removed: 5 red
- Popover `onOpenChange` removed: 1 red
- `noopener,noreferrer` dropped: 1 red
- items order reversed: 4 red
- two of my own mutations did not apply (no-op patterns), so I make no claim on them; the author declared the redundant "no user" guards (single removal undetectable): accepted, both guards are the same behaviour from the outside and the suite does cover removing both (author: 2 red).

## Tests quality
- Exact-DOM literal comparisons are normalised (ids, icon path data, popover inline position) and complemented by behavioural assertions (focus, aria-expanded, callbacks, tab order/wrap, Escape focus return). Not decorative: they bit on the mutations above.
- Unmount "documents current behaviour" test: acceptable. It is clearly commented as a deliberate pin, states a cleanup must update it, and asserts observable effects (queue kept, stale host removed on next mount). Not an `it.fails`. It does pin a defect (no cleanup), which is a conscious, labelled choice.
- `describe` "removed by t03 if accepted" is labelled; fine.
- Locale parity test duplicates part of `check-locales` by design (scoped to the two namespaces); minor redundancy only.
- Script tag checked in `document.head` (React 19 hoisting): sound, but hoisted scripts are deduped by src and survive cleanup, so "widgetPath changes the source" relies on a unique src per test; fine today.

## Stories
Closed/Open for the waffle, Closed/Open/WithoutUser for the user menu: they type-check (lint/build green) and match AC1 states. Waffle Open depends on the remote widget and network. Plan says they were viewed on port 24962 with axe; I did not rerun Storybook.

## Not verified
- Stories rendered in a browser (not rerun by me); the waffle panel opening, its `aria-expanded` and its keyboard behaviour are the remote widget's and are NOT tested anywhere (only that Enter/Space on the real button reach a listener, via a stub). A human should open the waffle with the keyboard on a deployed page.
- ArrowDown behaviour of the user menu, not asserted by design.
- Real layout/popover placement (jsdom has none).
- Flaky SimpleDataGrid / gantt CT not run in isolation; the full suite was green.

## Findings
- minor: locale-parity test partially duplicates `check-locales`.
- minor: the user-menu literal DOM strings are long and brittle to any markup change (intended guard, but expect churn in t02).

Max severity: minor
Ship allowed: yes
