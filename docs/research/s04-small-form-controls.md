# Research — Story s04-small-form-controls

Worktree `.worktrees/s04-small-form-controls`, branch `feature/s04-small-form-controls` (from `next` at `a2b6562a`). Dependencies installed. Nothing was built; the 40 existing Vitest tests of the three controls were run once and pass. Every claim comes from reading source and the generated `packages/ui-components/src/cunningham-tokens.css` (values of `ui-components`, not `ui-tokens`).

## Premise check (read this first)
- **True:** the three controls live in `components/forms/{checkbox,radio,switch}`; `Radio` has an empty `tokens.ts` (`export const tokens = () => ({})`, registered `"forms-radio": radioTokens()` at `cunningham.ts:35`, so it emits **no** variable) and its SCSS reads `--c--components--forms-checkbox--*` (`forms/radio/_index.scss:5-9,38`); the Switch `labelSide` prop exists (`"left" | "right"`, default `"left"`, `forms/switch/index.tsx:6,19`).
- **True but incomplete: "Radio reuses the checkbox tokens".** Radio also reuses the checkbox **markup and SCSS**: its root `<label>` carries `c__checkbox c__radio`, and `Switch` carries `c__checkbox c__switch` (`radio/index.tsx:33`, `switch/index.tsx:42-45`). The shared outer shell (padding, focus-within ring, disabled, label, footer indent) is written once in `forms/checkbox/_index.scss`. A `c__checkbox--small` modifier on the root therefore reaches all three controls.
- **Not stated by the story, and it breaks the obvious API: `size` already exists on the props.** All three prop types are `InputHTMLAttributes<HTMLInputElement> & ...`, and React types `size?: number` there (`@types/react` `InputHTMLAttributes`). Adding `size?: "medium" | "small"` to an intersection gives `number & string` = `never`. The props must `Omit<InputHTMLAttributes<HTMLInputElement>, "size">` and `size` must be destructured out so it is **not** forwarded to the `<input>` (all three spread `...inputProps` on it). This is a (harmless) narrowing of the public type: nobody can usefully pass a numeric `size` to a checkbox, but it is a type-level change to report.
- **Not in the story: the 24x24 test cannot run in Vitest.** jsdom returns zero for `getBoundingClientRect` and does not load SCSS (confirmed by s10: "Vitest does not load SCSS"). "Checked by a test on the rendered size" needs a real browser: Playwright component test (chromium; `e2e/card/` is the model). This is the main cost driver.
- **Not in the story: the `form/` vs `forms/` trap is milder than the notes imply.** `components/form/{checkbox,radio,switch}` hold only `*.stories.tsx` (title "Components/Forms/<X>/UI Kit extensions") and a 0-byte `index.scss`. `library.scss:25-27` `@use`s those empty files; the real styles reach the bundle through `library.scss:1 @use "./cunningham"` -> `cunningham.scss:9,11,16` -> `forms/*`. Code, SCSS, tokens, specs, `.mdx` and the main stories are all in `forms/`.
- **Premise "default size unchanged": achievable, but the hard-coded literals make it fragile** (see facts 3 and 4).

## The five structuring facts
1. **Default dimensions today** (read from `cunningham-tokens.css:623` and the SCSS): checkbox/radio box `--c--components--forms-checkbox--size: 1.5rem` (24px, border 1.5px, UA `box-sizing: border-box` on checkbox/radio inputs); gap to label `0.5rem` (SCSS literal, `checkbox/_index.scss:36`); label font-size effective `0.875rem` (`sm`: `cunningham.ts:69-71` overrides the `s`/0.75rem of `forms/checkbox/tokens.ts:8`); check/indeterminate SVG fixed 24x24 attributes (`checkbox/index.tsx:100-101,118-119`); hint text `forms-field--font-size` 0.75rem (`field/tokens.ts`). Switch rail `2.8125rem x 1.5rem` (45x24), handle `1.125rem` (18) at `left: 4px; top: 3px`, checked `translateX(20px)` — **all SCSS literals, no token** (`switch/_index.scss:25,40-41,49-52`). Radio inner dot `1rem` literal (`radio/_index.scss:44-45`), i.e. exactly 2/3 of the box.
2. **The hit area is the whole `<label>`, no pseudo-element.** Root `<label class="c__checkbox">` has `padding: 0.25rem` + `1px` transparent border, `margin-left: -0.25rem` (`checkbox/_index.scss:11-20`); the input, the SVGs, the label text and the hint text are all inside it, so a click anywhere in the label toggles the input. Without label text, a default checkbox/radio is therefore **24 + 2x4 + 2x1 = 34 x 34 px**; a switch is 45+10 = 55 x 34. With a 16px small box the same shell gives 26 x 26: **24x24 is met by keeping the existing label padding, with no new mechanism**, provided box >= 14px (24 - 2x(4+1)). Disabled controls use `pointer-events: none` (not operable by design).
3. **The Checkbox box and its check mark are not driven by one number.** The input uses the `size` token, but the two SVGs are absolutely positioned 24x24 attributes (`checkbox/_index.scss:~178`). A small box needs the SVG sized by CSS to the same variable (CSS width/height override the attributes), otherwise the mark overflows the 16px box. The Radio dot (fact 1) and the footer indent (`padding: 0.25rem 0 0 calc(2rem)` for checkbox/radio, `3.3rem` for Switch `right`, `checkbox/_index.scss:9,32`; `switch/_index.scss:98`) are literals derived from the box size and must follow it, otherwise hint text drifts under a small control.
4. **Focus ring = the shared label shell, `:focus-within`.** `.c__checkbox:focus-within` draws a 1px brand border + 1px brand `box-shadow` on the label (`checkbox/_index.scss:22-26`); the input additionally changes border/box-shadow on `:focus` (checkbox `:44-48`, radio `:30-33`). It is **not** `:focus-visible` (it also shows after a mouse click) and it surrounds the whole label, so it does not depend on the box size and is kept by construction if the shell is untouched. The Switch input is `opacity:0; width:0; height:0; position:absolute` (`switch/_index.scss:2-9`), still focusable; the ring is the label's.
5. **Consumers: only Checkbox is used inside the library, never Radio or Switch.** `Checkbox` in `data-grid/index.tsx:238` (select-all header, `indeterminate`), `data-grid/utils.tsx:57` (row selection, no label), `forms/select/multi-menu.tsx:94` (with `fullWidth`; the select SCSS overrides `.c__checkbox` padding `0.75rem` and label font, `select/_index.scss:274-283`), `feedback-form/FeedbackForm.tsx:301`; plus stories under `forms/examples/*` and `form/form.stories.tsx`. None passes `size`, so a default-size regression shows up first in DataGrid selection and the multi-select menu. `Radio` and `Switch` have no in-repo consumer other than stories.

## Target story
**As a** designer of a dense interface **I want** small variants of checkbox, radio and switch **so that** forms fit compact layouts. Complexity 2 in `docs/stories.md:66-82`. Acceptance criteria:
- AC1 `Checkbox`, `Radio` and `Switch` each accept a size option; the small size renders with dimensions defined by tokens.
- AC2 Default size unchanged for existing callers (no visual or API regression, existing tests pass).
- AC3 Each small control keeps its label, hint text, error and success states, and its focus ring.
- AC4 Each small control has an interactive area >= 24x24 px (test on the rendered size) and stays operable by keyboard and pointer.
Notes: ui-kit #244 (small checkbox), #269 (small radio), #245 (small switch), all labelled "Design approved"; Radio tokens: do not add parallel tokens; Switch `labelSide` must keep working.

## Upstream issues (read-only, `gh issue view <n> --repo suitenumerique/ui-kit`, reachable)
- #244 "New small checkbox" (open, assignee PanchoutNathan): image + "To save space on small interfaces and to provide an alternative to the larger version derived from the DSFR." Figma `node-id=6977-4058`.
- #269 "New small radio" (open, no assignee): same sentence. Figma `6977-3825`.
- #245 "New switch small" (open, assignee PanchoutNathan): "Added a smaller switch for dense interfaces." Figma `6977-3745`.
- **None gives a number.** The dimensions live only in the Figma file and in screenshots (not read: Figma needs an authenticated MCP, not available here). The small sizes in the design are therefore **proposals to confirm**. The issues also say "alternative to the larger version derived from the DSFR": the current 24px box is that larger variant, consistent with keeping it as default.

## Current state of the code
- `forms/checkbox/`: `index.tsx` (Checkbox with local `value` state mirrored from `checked`, `indeterminate` set on the DOM node in an effect, `CheckboxGroup`), `_index.scss` (shell + box + states + the SVG clip-path show/hide for check and indeterminate), `tokens.ts` (16 keys, registered `forms-checkbox`), `index.stories.tsx`, `index.mdx`, `index.spec.tsx` (190 lines), `checkmark.svg`, `resources/`.
- `forms/radio/`: `index.tsx` (Radio, RadioGroup reusing `c__checkbox__group`), `_index.scss`, empty `tokens.ts`, stories, mdx, spec (164 lines).
- `forms/switch/`: `index.tsx` (`label?: string`, `labelSide`), `_index.scss`, `tokens.ts` (7 keys: accent, rail background/radius, handle background/radius, disabled variants; no dimension), stories, mdx, spec (168 lines).
- Shared wrapper `forms/field` (`Field`, `FieldProps`: `state` success|error|default, `text`, `textItems`, `rightText`, `fullWidth`, `compact`, `disabled`, `labelWidth`); the three controls always render it with `compact={true}`. State colours are applied by `.c__field--error|success` (footer text and `label` colour), unaffected by the control size.
- Existing size prop elsewhere: `Button` `size?: "medium" | "small" | "nano"`, default `"medium"`, class `"c__button--" + size` (`button/index.tsx:15,34,48`), tokens `button--{small,nano}-height`, `-font-size`, `-icon-font-size` in `button/tokens.ts:10-17`, SCSS `&--small {...}` reading them (`button/_base.scss:141-169`). No other component has a `size` prop on a form control. Convention to follow: an `size` union with the default value listed first, modifier class `c__<name>--<size>`, **`small-*` keys inside the existing token table**.
- Tests: Vitest specs beside components; Playwright CT in `e2e/<name>/` with `e2e/helpers/mount-<name>.tsx` (`CunninghamProvider`, imports `../src/index.scss` through `playwright/index.tsx`, so real CSS is loaded); chromium only installed locally (`~/Library/Caches/ms-playwright`: chromium 1243). No `e2e/` folder for forms yet.
- Stories: titles `Components/Forms/Checkbox|Radio|Switch` in `forms/*/index.stories.tsx` (all have Default, Checked, WithLabel, Disabled, Error, Success; Switch adds `WithLabelRight*`). Storybook a11y addon is enabled (`.storybook/main.ts`). Docs pages `forms/*/index.mdx`.
- Changesets: `.changeset/*.md`, `"@gouvfr-lasuite/ui-components": minor` plus a gitmoji line (`cards-group-content.md`).
- Generated tokens: `yarn build-theme` rewrites `src/cunningham-tokens.{css,scss,ts}`; `cunningham-tokens-sass.scss` is known to be out of sync with `cunningham-tokens.scss` at HEAD (s10 plan): do not commit unrelated drift.

## Anchor points
- Types/props: `forms/checkbox/index.tsx` (`CheckboxOnlyProps`, `CheckboxProps`, root `classNames`), `forms/radio/index.tsx` (`RadioOnlyProps`, root classes), `forms/switch/index.tsx` (`SwitchOnlyProps`, root classes). Exports already in `src/index.ts:7-8,34-35,42,74-75,110-111,118`; a new exported type for the union is optional.
- Tokens: `forms/checkbox/tokens.ts` (box size, font size, shared by Radio), `forms/switch/tokens.ts` (rail/handle dimensions). `forms/radio/tokens.ts` stays empty. Registration in `cunningham.ts` already exists for both; no new key there.
- Styles: `forms/checkbox/_index.scss` (modifier `.c__checkbox--small` for the shell, input, SVG, footer indent), `forms/radio/_index.scss` (dot), `forms/switch/_index.scss` (rail, handle, travel, footer indent).
- Tests: extend the three `index.spec.tsx`; new `e2e/form-controls/*.spec.tsx` + `e2e/helpers/mount-form-controls.tsx`.

## Verified APIs / functions
- `InputHTMLAttributes<HTMLInputElement>` (`@types/react`): has `size?: number` — conflicts with a string union.
- `classNames` (package `classnames`) is the helper in these three files (Button/Card use `clsx`/`classnames` variously; stay with `classnames` here).
- `DefaultTokens` from `@gouvfr-lasuite/ui-tokens`: `defaults.globals.font.sizes.{xs,s,sm}`, `defaults.globals.spacings.{4xs,3xs,xs}`.
- `Locator.boundingBox()` / `toHaveCSS` (Playwright CT) for the rendered-size and focus tests (used in `e2e/tabs/tabs.spec.tsx:145`, `e2e/card/card.spec.tsx`).

## Traps & constraints
- `size` collision (above): `Omit<..., "size">` on all three prop types; do not forward `size` to the DOM.
- `Radio` and `Switch` import no style from their own tokens for the shell: **never add `forms-radio` keys**; add `small-*` keys to `forms-checkbox` (shared by Checkbox and Radio) and `forms-switch` (rail/handle only).
- `cunningham.ts:69-71` overrides `forms-checkbox.font-size`: a new `small-font-size` default in `tokens.ts` is not touched by that override, but verify the resolved variable in the generated CSS.
- `Checkmark`/`Indeterminate` carry `onClick={(e) => e.stopPropagation()}`; the label still activates natively, but a test must click the label padding and the SVG both.
- `.c__checkbox--disabled` sets `pointer-events: none` and `color ... !important`; the small modifier must not re-enable events.
- `select/_index.scss:274` overrides `.c__checkbox` padding to `0.75rem` and `margin-left: 0`: a small checkbox in that menu would exceed 24 px anyway; default (no `size`) must not change.
- Switch Chromium quirk: the input is `position:absolute` on purpose (`switch/_index.scss:5-7`); keep.
- Switch `translateX(20px)` leaves a 3px (not 4px) gap at the end of the travel; the small variant should compute the travel from tokens, but the **default** keeps its literals to stay pixel-identical.
- Fractional values: 2/3 of 16px = 10.67px dot; renders anti-aliased. Acceptable, flagged to the owner.
- Generated token files: regenerate with `yarn build-theme`; never hand-edit; known sass drift (restore `cunningham-tokens-sass.scss` then add only the new blocks).
- Ports: Storybook/CT servers on `bash .dm/lib/dm-port.sh` (here 28279), not 6006.

## Open questions
1. **Exact small dimensions.** The Figma nodes (6977-4058 / 3825 / 3745) were not readable; the design proposes box 16px (1rem), label 12px (`xs`), switch rail 32x16 with a 12px handle and 2px inset. Owner to confirm against Figma; changes are a token value edit only.
2. **Radio dot at small size:** derive it as 2/3 of the box (`calc(var(--size) * 2 / 3)`, zero new token, default stays 16px) or add a `radio-dot-size`/`small-radio-dot-size` token to the checkbox table? Proposed: calc, no token.
3. **Prop name and values:** `size?: "medium" | "small"` (matches Button's default name `medium`) vs `"default" | "small"`. Proposed `medium | small`; no `nano`. Owner to confirm.
4. **Narrowing of `size` from `number`:** accepted as a type-level change (minor changeset)? Alternative `controlSize` avoids it but diverges from Button.
5. **Browsers:** only chromium available locally; webkit/firefox rendering of the 26px hit area and fractional dot unverified.
6. **Switch label `string`:** unchanged (not widened to `ReactNode`); out of scope.

## Real complexity
Scored 2, re-scored **3**. The CSS is small per control, but the story hides: a type collision on `size` across three prop types, a shared SCSS shell that must be extended without moving the default pixel by pixel (literal 45x24 rail, 1rem dot, 2rem/3.3rem footer indents), tokens that exist only for the checkbox, and an AC (rendered size) that needs a new Playwright harness because Vitest cannot measure. No dependency, no data, no i18n. Three tickets, about 4.5 person-days.
