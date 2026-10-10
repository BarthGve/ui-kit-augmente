---
validated: yes
---
# Plan — Story s11-accordion

Branch: `feature/s11-accordion` (framing) · tickets: `feature/s11-accordion/<ticket-id>`
Research: `docs/research/s11-accordion.md` — read it first; this plan does not repeat it. Design: `docs/designs/s11-accordion.md` (anatomy, states, token table, gaps).

## Target story
**As a** user **I want** collapsible panels **so that** I read long content section by section. Complexity 2 in stories.md, 2 after research (React Aria `DisclosureGroup` gives state and ARIA; arrow keys must be added).
The premise "no equivalent in ui-kit" holds. New component, so each ticket is **test-first inside the ticket**: specs are written and seen failing before the code, and the ticket is committed only when everything is green (no `it.fails` ships, since no behaviour pre-exists).
Acceptance criteria (docs/stories.md):
- AC1 `Accordion` opens and closes a panel on click and on Enter or Space.
- AC2 A single-open mode and a multiple-open mode are available.
- AC3 Each trigger exposes the expanded state to assistive technology, and arrow keys move between triggers.
- AC4 The open state can be controlled or left uncontrolled.

## Tickets (ordered)
### t01-accordion-core
- **size:** M
- **estimate:** 1.5d
- **depends on:** none
- **scope:** `Accordion` + `AccordionItem` on React Aria `DisclosureGroup` / `Disclosure`: structure, ARIA, click / Enter / Space, single and multiple mode, controlled and uncontrolled, disabled, tokens, styles (tokens only), registration, stories, changeset. Covers AC1, AC2, AC4 and the ARIA half of AC3. One execute / review / ship slice.

Tasks:
1. [x] Write `packages/ui-components/src/components/accordion/Accordion.spec.tsx` first (import `it` from `vitest`) and see it fail: (a) AC3 ARIA: each trigger is a `button` inside a heading of the requested `headingLevel` (default 3), has `aria-expanded="false"` and `aria-controls` equal to its panel's `id`, and the panel has `aria-labelledby` equal to the trigger's `id`; (b) AC1: `userEvent.click`, then `{Enter}`, then `{Space}` on a focused trigger each toggle `aria-expanded` `false -> true -> false` (three separate assertions, one per input); (c) a collapsed panel is `hidden` / `aria-hidden="true"` and a button inside it is not reachable by `Tab`; expanded, it is; (d) AC2 single mode (default): opening B closes A; multiple mode (`allowsMultipleExpanded`): A and B stay open; (e) AC4 uncontrolled: `defaultExpandedKeys={["b"]}` starts with B open and `onExpandedChange` receives a `Set` with the new keys; (f) AC4 controlled: `expandedKeys={["a"]}` ignores clicks (still A) until the parent changes the prop, and `onExpandedChange` is called with the requested keys; (g) `isDisabled` on an item: trigger is `disabled`, click does nothing; `isDisabled` on the group disables all; (h) root is a `div` with `className` and extra props (`id`, `data-*`) forwarded; (i) AC-tokens: every key of `tokens.ts` has a `--c--components--accordion--<key>` declaration in `:root` of `src/cunningham-tokens.css` (read from disk, `card` technique) [fails until `yarn build-theme`]; (j) stylesheet: `index.scss` reads colours, padding, border and ring values from `var(--c--components--accordion--…)`, contains no hex colour, `rgb(` nor `px`/`rem` literal outside comments, sets the `focus-visible` outline from the ring tokens, a `forced-colors` rule with `Highlight`, and a `prefers-reduced-motion` rule removing the transitions [fails until the SCSS exists]. — Done: 15 cases, seen red (module missing), then (j) red until the SCSS existed.
2. [x] Create `components/accordion/tokens.ts` with the token table of the design (`color`, `color--disabled`, `border-color`, `border-width`, `trigger-background-color--hover`, `trigger-font-weight`, `trigger-padding`, `panel-padding`, `icon-size`, `focus-ring-color|width|offset`), refs from `DefaultTokens`, literals only for `1px`, `1.5rem`, `2px`, `-2px`; import and register as `accordion` in `packages/ui-components/cunningham.ts` (`componentTokenDefaults`). — Done.
3. [x] Run `yarn build-theme` (build `@gouvfr-lasuite/ui-tokens` first if the `cunningham` binary needs its dist); check the 12 `--c--components--accordion--*` variables appear in the six theme blocks; restore `src/cunningham-tokens-sass.scss` to its previous content plus only the accordion hunks if the copy rewrote unrelated lines (s10 precedent). Never hand-edit `cunningham-tokens.*`. Test (i) turns green. — Done: 72 vars in the css (12 x 6); sass copy restored, only the 84 accordion lines re-applied.
4. [x] Create `Accordion.tsx`, `types.ts` (`AccordionProps`: `children`, `allowsMultipleExpanded?`, `expandedKeys?`, `defaultExpandedKeys?`, `onExpandedChange?`, `isDisabled?`, `className?`, plus the HTML div attributes; `AccordionItemProps`: `id: Key`, `title: ReactNode`, `children`, `headingLevel?: 1|2|3|4|5|6`, `isDisabled?`, `className?`), `index.tsx` (`export *`). `Accordion` = RAC `DisclosureGroup` with `clsx` class `c__accordion`; `AccordionItem` = `Disclosure` > `Heading` > `Button slot="trigger"` (title + decorative `Icon expand_more`, `aria-hidden`) + `DisclosurePanel` > inner `div.c__accordion__panel-content`. No `useControllableState`, no extra state: RAC owns it. Tests (a)-(h) turn green. — Done: (a)-(i) green.
5. [x] Create `index.scss` (BEM, tokens only: dividers, trigger padding and hover, chevron rotation on `[data-expanded]`, panel `height: var(--disclosure-panel-height)` with `overflow: clip` and transition on the panel element, padding on the inner wrapper, `[data-disabled]`, `:focus-visible` / `[data-focus-visible]` outline, forced-colors, reduced motion, `overflow-wrap: anywhere`, `min-width: 0`); add `@use "./components/accordion";` to `src/library.scss`; add `Accordion`, `AccordionItem` and `export type { AccordionProps, AccordionItemProps }` to `src/index.ts`. Test (j) turns green. — Done: (j) green.
6. [x] Create `accordion.stories.tsx` (`title: "Components/Accordion"`, `tags: ["autodocs"]`): `Default` (single), `Multiple`, `DefaultExpanded`, `Controlled` (external buttons driving `expandedKeys`), `WithDisabledItem`, `LongContent`. Open the stories in Storybook on the port from `bash .dm/lib/dm-port.sh`, run the a11y addon on each story in the `default`, `dark` and `dsfr-light` themes, stop the server. Limits that cannot be checked by the agent (no human browser) go in the PR description. — Done: axe-core (the a11y addon engine) on the 6 stories x default/dark/dsfr-light, 0 violations after the existing Button colour transition settles; storybook stopped.
7. [x] Add `.changeset/<name>.md` for `@gouvfr-lasuite/ui-components`: **minor** (new component), gitmoji line `✨(accordion) add Accordion with single and multiple open modes`. — Done: `.changeset/open-accordion-panels.md`.
8. [x] Run `yarn lint`, `yarn check-locales`, `yarn test --concurrency=1`, `yarn build`; restore `cunningham-tokens-sass.scss` if the build rewrote it. The PR description carries `Artifact: updated (version <id>)` (page for Accordion with props and tokens read from the code, entry in the `Composants` catalogue, `project/canvas.json`): done by the main agent after the implementer, reading the published index again before merging. — Done: lint, check-locales, 634 tests, build green; sass copy restored. Artifact left to the main agent.

### t02-accordion-keyboard
- **size:** M
- **estimate:** 1d
- **depends on:** t01-accordion-core
- **scope:** arrow-key navigation between triggers (the part React Aria does not provide), focus-ring verification in a real browser and in the six themes, Storybook docs page. Covers the keyboard half of AC3.

Tasks:
1. [ ] Extend `Accordion.spec.tsx` first and see it fail: (a) AC3: with focus on trigger 1, `{ArrowDown}` focuses trigger 2, `{ArrowUp}` returns to 1 [fails today: no handler]; (b) `ArrowDown` on the last trigger focuses the first, `ArrowUp` on the first focuses the last (wrap); (c) `{Home}` / `{End}` focus the first / last enabled trigger; (d) a disabled trigger is skipped in both directions; (e) arrow keys do not move focus and are not `defaultPrevented` when the event comes from an `<input>` or `<textarea>` inside an open panel; (f) two nested accordions: arrows inside the inner one never focus a trigger of the outer one; (g) arrow navigation does not toggle any panel (`aria-expanded` unchanged) and Enter after arrowing toggles the newly focused trigger once; (h) ring contrast: in the six themes, `focus-ring-color` against both `surface.secondary` and `background.semantic.neutral.tertiary` is >= 3:1 (resolve `var()` chains from `cunningham-tokens.css`, technique of `button/focus-ring.spec.tsx`; helpers copied locally, known duplication). (a)-(g) fail until the handler exists; (h) may be green from the start: prove it by mutation (repoint the ring token to `border.surface.primary`, see (h) red, revert).
2. [ ] Write the Playwright CT test first, `e2e/accordion/accordion.spec.tsx` + `e2e/helpers/mount-accordion.tsx` (`CunninghamProvider`, chromium only; run with a throwaway uncommitted config on the port from `dm-port.sh`): `Tab` then `ArrowDown` / `ArrowUp` / `End` / `Home` move focus across triggers (`toBeFocused`); the focused trigger's computed `outline-style` is `solid` and `outline-width` `2px` and the ring is **fully inside** the accordion's bounding box (offset not clipped); after a mouse click the outline is not `solid`; Enter and Space toggle and the collapsed panel's content is not reachable by `Tab`; the expanded panel's rendered height is greater than 0 and the collapsed one is 0 (no layout space left); under `reducedMotion: "reduce"` the panel `transition-duration` is `0s`. See it fail (arrow assertions fail until task 3; the others may pass from t01 and are kept as regression guards, saying so in the file).
3. [ ] Implement the arrow handler in `Accordion.tsx`: `onKeyDown` on the root, active only if `event.target.closest(".c__accordion__trigger")` exists and its `closest(".c__accordion")` is the current root; collect `root.querySelectorAll(".c__accordion__trigger:not(:disabled)")` filtered to the same root; `ArrowDown`/`ArrowUp` wrap, `Home`/`End` jump; `preventDefault` only when focus moved; user-supplied `onKeyDown` on the root is still called first. Add `className="c__accordion__trigger"` to the trigger. Tests 1(a)-(g) and the CT arrow assertions turn green. Inline code (about 15 lines), no new hook.
4. [ ] Add the `Accordion.mdx` page: structure, single vs multiple, controlled vs uncontrolled with `Set<Key>`, `headingLevel`, the keyboard table (Tab, Enter, Space, Arrow Up/Down, Home, End), the "controlled single mode with several keys" note, tokens table, "accessible name comes from `title`". Remove the `autodocs` tag from the stories (the MDX is the Docs page, as Tabs/Card). Add stories `Nested` and `WithFormControls`. Run the a11y addon on every story in `default`, `dark`, `dsfr-light`; drive the stories once with the keyboard; stop the server.
5. [ ] Run `yarn lint`, `yarn check-locales`, `yarn test --concurrency=1`, `yarn build`, and `yarn test:ct` on the chromium project for `e2e/accordion/`; restore `cunningham-tokens-sass.scss` if rewritten. No second changeset (t01's minor covers the component); amend its text only if the API changed. The PR description carries `Artifact: updated (version <id>)` (page keyboard and interaction notes, catalogue entry, `project/canvas.json`), done by the main agent.

## US totals
- **Person-days:** 2.5 (1.5 + 1.0)
- **Size mix:** 2×M

## Run interdicts
- No new dependency (`react-aria-components` 1.16.0 is installed); no ADR needed (ADR 002 conventions followed), so ADR 005 stays free.
- Do not edit generated `src/cunningham-tokens.*`; regenerate with `yarn build-theme`.
- No literal colour, spacing or radius in `index.scss`; literals only in `tokens.ts`, limited to `1px`, `1.5rem`, `2px`, `-2px`.
- No change to any existing component, token, story or hook (Alert's expandable mode, `useControllableState`, `useArrowRoving` are left alone). No `Collapsible` (s37) work.
- No i18n key, no variants, no `items`-array API, no icon prop, no `region` role option (the owner can ask later). The component holds no state of its own: React Aria does.
- A ticket never merges with a red test; no `it.fails` is expected (new component).

## The point everything turns on
Arrow keys: React Aria's disclosure group gives state, ARIA and Enter/Space but **no** arrow navigation, and AC3 requires it. The plan adds a ~15-line scoped `onKeyDown` in t02 (wrap, Home/End, disabled skipped, ignores events from panel content, nested-safe) rather than reuse `useArrowRoving` (ArrowLeft/Right only, `button` descendants, capture listeners). If the owner prefers no wrap or no Home/End, only t02 tasks 1 and 3 change.

## Files touched
- t01: `components/accordion/{index.tsx,Accordion.tsx,types.ts,tokens.ts,index.scss,accordion.stories.tsx,Accordion.spec.tsx}` (new); `packages/ui-components/cunningham.ts`; `src/library.scss`; `src/index.ts`; regenerated `src/cunningham-tokens.{css,scss,ts}` (and any other tracked file the generator rewrites); `.changeset/<name>.md` (new); the design-system artifact (outside the repo).
- t02: `components/accordion/Accordion.tsx`, `Accordion.spec.tsx`, `accordion.stories.tsx`, `Accordion.mdx` (new); `e2e/accordion/accordion.spec.tsx` and `e2e/helpers/mount-accordion.tsx` (new); the artifact.

## Test strategy
- Unit (Vitest + Testing Library, jsdom): ARIA structure, click/Enter/Space, single and multiple, controlled and uncontrolled, disabled, arrow/Home/End, token existence and textual stylesheet checks, ring contrast over six themes. jsdom has no `getAnimations`, so the height animation path is not exercised there; SCSS is not rendered, so style checks are textual by design.
- Component (Playwright, chromium): real `Tab` / arrow focus, computed outline on keyboard vs pointer focus, ring inside the box, collapsed height 0 and unreachable content, reduced motion. Webkit/firefox are not installed locally: not verified.
- Manual: Storybook a11y addon on every story in `default`, `dark`, `dsfr-light`; one keyboard pass.
- Prerequisite: dependencies installed; a chromium for Playwright CT.

## Definition of Done
Single PR into `next` per ticket, structured description with `Artifact: updated (version <id>)` (the design-system artifact page for Accordion, its catalogue entry in `Composants` and `project/canvas.json` are updated by the main agent after the implementer; `/dm-review` refuses the ticket without the line), readable diff, `yarn lint`, `yarn check-locales`, `yarn test --concurrency=1`, `yarn build` pass (t02 also `yarn test:ct` on chromium for `e2e/accordion/`), one changeset (minor) shipped with t01, review passed (no open critical or major), merged to `next`.
