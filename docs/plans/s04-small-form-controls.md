---
validated: yes
---
# Plan — Story s04-small-form-controls

Branch: `feature/s04-small-form-controls` (framing) · tickets: `feature/s04-small-form-controls/<ticket-id>`
Research: `docs/research/s04-small-form-controls.md` — read it first; this plan does not repeat it. Design: `docs/designs/s04-small-form-controls.md` (API, token tables, states, gaps).

## Target story
**As a** designer of a dense interface **I want** small variants of checkbox, radio and switch **so that** forms fit compact layouts. Complexity 2 in stories.md, 3 after research (type collision on `size`, shared SCSS shell, literals to keep pixel-identical, a real-browser size test).
Acceptance criteria (docs/stories.md):
- AC1 `Checkbox`, `Radio` and `Switch` each accept a size option; the small size renders with dimensions defined by tokens.
- AC2 Default size unchanged for existing callers (no visual or API regression, existing tests pass).
- AC3 Each small control keeps its label, hint text, error and success states, and its focus ring.
- AC4 Each small control has an interactive area >= 24x24 px (checked by a test on the rendered size) and remains operable by keyboard and pointer.

Premise check: confirmed (Radio's empty `tokens.ts` reuses the checkbox table; `labelSide` exists) with one correction: `size` already exists as `number` on the inherited `InputHTMLAttributes`, so the props are `Omit<..., "size">` (research, premise check).

Rules for every ticket: merged **alone** into `next` with all tests green; tests are written first and seen failing, no `it.fails` shipped (the feature is new, nothing pre-exists to mark); one commit per ticket; one changeset (minor, new prop); PR description carries `Artifact: updated (version <id>)` (the component page, its `Composants` catalogue entry and `project/canvas.json`, done by the main agent after the implementer); `yarn build-theme` regenerates `cunningham-tokens.*`; **known drift**: `cunningham-tokens-sass.scss` is out of sync with `cunningham-tokens.scss` at HEAD, so after any build-theme/build restore it from git and apply only the new `small-*` blocks, never unrelated drift; Storybook check by Playwright + axe on each new story in `default`, `dark`, `dsfr-light` on the port from `bash .dm/lib/dm-port.sh`, server stopped afterwards.

## Tickets (ordered)
### t01-checkbox-small
- **size:** M
- **estimate:** 2.0d
- **depends on:** none
- **scope:** `size` on `Checkbox` (type fix, modifier class, `forms-checkbox` `small-size` and `small-font-size` tokens, box/SVG/footer styles), the shared real-browser harness for the three controls, stories, docs, changeset. The shared shell modifier `c__checkbox--small` created here is what t02 and t03 build on. Covers AC1-AC4 for the checkbox.

Tasks:
1. [ ] Write first, in `forms/checkbox/index.spec.tsx`, and see them fail: (a) `size="small"` puts `c__checkbox--small` on the root label [fails: no such class]; (b) no `size` and `size="medium"` render the exact same root class list as today and **no** `c__checkbox--small` (AC2); (c) `size` is not forwarded: `input.hasAttribute("size")` is false for `small` [fails: forwarded today]; (d) `// @ts-expect-error` on `size="huge"` and `size={3}` (compiled by `tsc` in `yarn build`); (e) `small-size` and `small-font-size` exist as `--c--components--forms-checkbox--small-*` in the six theme blocks of `src/cunningham-tokens.css`, read from disk like `button/focus-ring.spec.tsx` [fails: tokens absent]; (f) with `size="small"`, label, hint `text`, `state="error"`/`"success"` classes and `indeterminate` still render (AC3).
2. [ ] Write first the Playwright CT test `e2e/form-controls/checkbox.spec.tsx` + `e2e/helpers/mount-form-controls.tsx` (`CunninghamProvider`; chromium only, throwaway config on the port from `dm-port.sh`, not committed, as in s03/s10): (a) **default regression** (AC2): a default checkbox input is 24 x 24 px, its root label 34 x 34 (no label text) [passes today: guards the baseline]; (b) small input is 16 x 16, small root label `boundingBox()` >= 24 x 24 (AC4) [fails: no small size]; (c) a click at the label padding outside the 16px box toggles the checkbox; keyboard: `Tab` focuses, `Space` toggles, the label shows a computed `border-color` equal to the brand focus colour (AC3, AC4); (d) the SVG check is 16 x 16 and `indeterminate` shows the dash inside the box; (e) hint text left edge sits `small-size + 8px` right of the box left edge.
3. [ ] Edit `forms/checkbox/tokens.ts`: add `small-size` (`"1rem"`) and `small-font-size` (`defaults.globals.font.sizes.xs`) with a comment stating the >= 14px rule behind the 24px floor; run `yarn build-theme`; check the two variables in the six theme blocks and that the css/scss/ts diffs contain only them; restore `cunningham-tokens-sass.scss` from git then add only the two new lines. Never hand-edit `cunningham-tokens.*`. Test 1(e) turns green.
4. [ ] Edit `forms/checkbox/index.tsx`: `CheckboxProps` = `Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & ... & { size?: "medium" | "small" }`; destructure `size = "medium"` out of the forwarded props; add `"c__checkbox--small": size === "small"` to the root `classNames`. Tests 1(a)-(d),(f) turn green; every existing checkbox test still green.
5. [ ] Edit `forms/checkbox/_index.scss` with a `&--small` block on `.c__checkbox`: input `width`/`height` = `small-size`; `svg` width/height = `small-size`; `__label` font-size = `small-font-size`; `__container` gap = `var(--c--globals--spacings--xs)`; footer `padding-left` = `calc(small-size + var(--c--globals--spacings--xs))`. No literal colour, spacing or radius; the default rules are not edited. Playwright 2(b),(c),(d),(e) turn green; 2(a) stays green.
6. [ ] Stories in `forms/checkbox/index.stories.tsx`: `Small`, `SmallWithLabel`, `SmallIndeterminate`, `SmallError`, `SmallSuccess`, `SmallDisabled`, `SizesCompared` (medium next to small); document `size` in `index.mdx`. Run the Storybook check (Playwright + axe, `default`/`dark`/`dsfr-light`) on each, with one keyboard pass; stop the server.
7. [ ] Add `.changeset/<name>.md`, `"@gouvfr-lasuite/ui-components": minor`, line `✨(Checkbox) add small size`.
8. [ ] Regression guard of the in-repo consumers (AC2): run the existing DataGrid and Select specs unchanged and check by reading `git diff` that no default rule of `_index.scss` changed. Run `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`, and `yarn test:ct` on chromium for `e2e/form-controls/`; restore `cunningham-tokens-sass.scss` if rewritten. PR carries `Artifact: updated (version <id>)` (done by the main agent).

### t02-radio-small
- **size:** S
- **estimate:** 1.0d
- **depends on:** t01-checkbox-small
- **scope:** `size` on `Radio`, reusing the t01 shell modifier and the **checkbox** `small-*` tokens; only the radio dot needs a rule. **No `forms-radio` token, `radio/tokens.ts` stays empty.** Covers AC1-AC4 for the radio.

Tasks:
1. [ ] Write first, in `forms/radio/index.spec.tsx`, and see them fail: (a) `size="small"` puts `c__checkbox--small` and `c__radio` on the root [fails]; (b) default and `size="medium"` render today's class list, no `--small` (AC2); (c) `input.hasAttribute("size")` is false [fails]; (d) `// @ts-expect-error` on `size="huge"`; (e) **no parallel token**: `src/cunningham-tokens.css` holds no `--c--components--forms-radio--` variable and `radio/tokens.ts` returns `{}` (passes today, guards the story's constraint); (f) small radio inside `RadioGroup` keeps group `text`, `state="error"`/`"success"`, disabled radio and "checking one unchecks the others" (AC3).
2. [ ] Write first `e2e/form-controls/radio.spec.tsx` (extend the t01 helper): (a) default radio is 24 x 24, label 34 x 34 [passes today]; (b) small input 16 x 16 and root label >= 24 x 24 [fails] (AC4); (c) the checked dot is `calc(small-size * 2/3)` (about 10.67px) and centred in the box (read via the `::before` computed width); the default dot stays 16px; (d) keyboard: `Tab` into the group, arrow keys move the selection, click on the label padding selects, label shows the brand focus border (AC3, AC4).
3. [ ] Edit `forms/radio/index.tsx`: `RadioProps` with `Omit<..., "size">` and `size?: "medium" | "small"`, same destructuring and `"c__checkbox--small": size === "small"`. Tests 1(a)-(d),(f) turn green.
4. [ ] Edit `forms/radio/_index.scss`: `&.c__checkbox--small input` width/height = `forms-checkbox--small-size` and `::before` size = `calc(var(--c--components--forms-checkbox--small-size) * 2 / 3)`; the `inset 1em 1em` fill and the default `1rem` are untouched. Do not edit `radio/tokens.ts` or `cunningham.ts`. Playwright 2(b)-(d) turn green.
5. [ ] Stories in `forms/radio/index.stories.tsx`: `Small`, `SmallWithLabel`, `SmallGroup`, `SmallGroupError`, `SmallGroupSuccess`, `SmallDisabled`; document `size` and the shared tokens in `index.mdx`. Storybook check (axe, three themes, keyboard pass); stop the server.
6. [ ] Add `.changeset/<name>.md`, minor, `✨(Radio) add small size`.
7. [ ] Run `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`, `yarn test:ct` (chromium, `e2e/form-controls/`); `cunningham-tokens.*` must show **no diff** in this ticket (no new token): `git diff --stat src/cunningham-tokens*` is empty. PR carries `Artifact: updated (version <id>)`.

### t03-switch-small
- **size:** M
- **estimate:** 1.5d
- **depends on:** t01-checkbox-small
- **scope:** `size` on `Switch`: rail/handle tokens in the existing `forms-switch` table, rail/handle/travel/footer styles for both `labelSide` values, the label font from the checkbox `small-font-size`. Covers AC1-AC4 for the switch. Independent of t02 (can merge before or after it).

Tasks:
1. [ ] Write first, in `forms/switch/index.spec.tsx`, and see them fail: (a) `size="small"` puts `c__checkbox--small` on the root next to `c__switch` and `c__switch--left` [fails]; (b) default and `size="medium"` render today's classes (AC2); (c) `input.hasAttribute("size")` false [fails]; (d) `// @ts-expect-error` on `size="huge"`; (e) the four `small-*` keys exist as `--c--components--forms-switch--small-*` in the six theme blocks of the generated css [fails]; (f) with `size="small"`, `labelSide="right"` still gives `c__switch--right`, and label, `text`, error/success and disabled still render (AC3, "label side must keep working").
2. [ ] Write first `e2e/form-controls/switch.spec.tsx`: (a) default rail 45 x 24, handle 18, and checked handle offset 20px [passes today: pixel baseline, AC2]; (b) small rail 32 x 16, handle 12, root label `boundingBox()` >= 24 x 24 (AC4) [fails]; (c) checked: the handle ends 2px from the rail's right edge (travel 16px); (d) `labelSide="left"` and `"right"` place the label on the expected side, hint text indented by rail width + 8px on the right variant; (e) keyboard: `Tab` focuses the hidden input, `Space` toggles, the label shows the brand focus border; click on the label padding toggles (AC3, AC4).
3. [ ] Edit `forms/switch/tokens.ts`: add `small-rail-width` (`"2rem"`), `small-rail-height` (`"1rem"`), `small-handle-size` (`"0.75rem"`), `small-handle-offset` (`defaults.globals.spacings["4xs"]`); `yarn build-theme`; verify the four variables in the six blocks and that the diffs are only them; restore `cunningham-tokens-sass.scss` then add only the new blocks. Test 1(e) turns green.
4. [ ] Edit `forms/switch/index.tsx`: `SwitchProps` with `Omit<..., "size">` and `size?: "medium" | "small"`; destructure it out of `inputProps`; class `"c__checkbox--small": size === "small"` on the root (keep `labelSide` default `"left"` and the `c__switch--<side>` class). Tests 1(a)-(d),(f) turn green.
5. [ ] Edit `forms/switch/_index.scss`: `&.c__checkbox--small` rules for `__rail` width/height, `:before` width/height/`left`/`top` from the handle tokens, checked `transform: translateX(calc(rail-width - handle-size - 2 * handle-offset))`, and the right-side footer indent `calc(small-rail-width + var(--c--globals--spacings--xs))`; the default literals (45x24, 18, 4px/3px, 20px, 3.3rem) are not edited. Playwright 2(b)-(e) turn green, 2(a) stays green.
6. [ ] Stories in `forms/switch/index.stories.tsx`: `Small`, `SmallWithLabel`, `SmallLabelRight`, `SmallWithText`, `SmallDisabled`, `SmallError`, `SmallSuccess`, `SizesCompared`; document `size` in `index.mdx`. Storybook check (axe, three themes, keyboard pass); stop the server.
7. [ ] Add `.changeset/<name>.md`, minor, `✨(Switch) add small size`.
8. [ ] Run `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`, `yarn test:ct` (chromium, `e2e/form-controls/`); restore `cunningham-tokens-sass.scss` if rewritten. PR carries `Artifact: updated (version <id>)`.

## US totals
- **Person-days:** 4.5 (2.0 + 1.0 + 1.5)
- **Size mix:** 2×M, 1×S

## Acceptance criteria coverage
| Criterion | Ticket | Test that can fail |
|---|---|---|
| AC1 size option, dimensions from tokens | t01, t02, t03 | spec 1(a),(d),(e); Playwright small box/rail dimensions equal the token values |
| AC2 default unchanged | t01, t02, t03 | spec 1(b); Playwright baseline 2(a) (24px box, 34px label / 45x24 rail); existing specs; DataGrid and Select specs unchanged (t01) |
| AC3 label, hint, error, success, focus ring kept | t01, t02, t03 | spec 1(f); Playwright focus border on the label, hint indent |
| AC4 interactive area >= 24x24, keyboard and pointer | t01, t02, t03 | Playwright `boundingBox()` >= 24 x 24, click on label padding toggles, `Tab`/`Space`/arrows |

## Run interdicts
- Default rendering is frozen: no edit of an existing default rule or literal in the three `_index.scss`, no change of `size`, `font-size`, rail or handle defaults; the reviewer checks `git diff` for edits outside new `small` blocks.
- **No `forms-radio` token** and no edit of `radio/tokens.ts`; no new `radio-*` key anywhere; no colour token; no `cunningham.ts` change.
- Do not edit generated `src/cunningham-tokens.*`; regenerate with `yarn build-theme`; never commit the unrelated `cunningham-tokens-sass.scss` drift.
- `size` is never forwarded to the DOM `<input>`; `labelSide`, `indeterminate`, `fullWidth`, `text`, `state` behave exactly as before.
- No new dependency, no ADR (no structural choice; ADR 005 stays free), no i18n key, no `size` on the groups, no edit of the Select/DataGrid/FeedbackForm consumers.
- A ticket never merges with a red test; no `it.fails`.

## The point everything turns on
The small dimensions are **proposals**: the Figma nodes behind ui-kit #244/#269/#245 are unread, and the design system has no control-size scale. The plan makes them token values (`small-size` 1rem, switch 32x16 / 12 / 2px) so that confirming or correcting them is a one-line change per token; the structure (modifier class on the shared label shell, `small-*` keys in the existing tables, hit area from the existing label padding) does not depend on them, as long as box and rail heights stay >= 14px.

## Files touched
- t01: `components/forms/checkbox/{index.tsx,_index.scss,tokens.ts,index.spec.tsx,index.stories.tsx,index.mdx}`; `e2e/form-controls/checkbox.spec.tsx` and `e2e/helpers/mount-form-controls.tsx` (new); regenerated `src/cunningham-tokens.{css,scss,ts}` and the new blocks of `cunningham-tokens-sass.scss`; `.changeset/<name>.md` (new); the design-system artifact (outside the repo).
- t02: `components/forms/radio/{index.tsx,_index.scss,index.spec.tsx,index.stories.tsx,index.mdx}`; `e2e/form-controls/radio.spec.tsx`, the helper; `.changeset/<name>.md`; the artifact. No token file.
- t03: `components/forms/switch/{index.tsx,_index.scss,tokens.ts,index.spec.tsx,index.stories.tsx,index.mdx}`; `e2e/form-controls/switch.spec.tsx`, the helper; regenerated token files; `.changeset/<name>.md`; the artifact.

## Test strategy
- Unit (Vitest + Testing Library, jsdom): class on the root, absence of the class by default, `size` not forwarded, type rejection via `@ts-expect-error` (compiled by `tsc`), token existence in the generated css over the six themes, states still rendered. jsdom neither loads SCSS nor measures layout, so no size is asserted here.
- Component (Playwright CT, chromium, real SCSS): rendered sizes of box/rail/handle/dot (default baseline and small), root label >= 24 x 24, click on the label padding, keyboard (`Tab`, `Space`, arrows), focus border, hint indent, both `labelSide` values. Webkit/firefox are not installed locally: not verified.
- Manual: Storybook a11y addon via Playwright + axe in `default`, `dark`, `dsfr-light`, one keyboard pass per control.
- Consumer regression: existing DataGrid and Select specs unchanged and green.
- Prerequisite: dependencies installed (they are), `yarn workspace @gouvfr-lasuite/ui-tokens build` before the first `yarn build-theme` if `dist` is missing (s10 note), a chromium for Playwright CT.

## Definition of Done
Single PR into `next` per ticket, structured description with `Artifact: updated (version <id>)` (the page of the control with its new `size` prop and `small-*` tokens read from the code, its `Composants` catalogue entry and `project/canvas.json`, updated by the main agent after the implementer; read the published index again before republishing and merge), readable diff, `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build` pass (t01-t03 also `yarn test:ct` on chromium for `e2e/form-controls/`), one minor changeset for `@gouvfr-lasuite/ui-components`, review passed with no open critical or major, merged to `next`. Commit: gitmoji + scope (`✨(Checkbox) add small size`).
