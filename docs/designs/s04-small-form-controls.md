# Design — Story s04-small-form-controls

Component story, no new screen. Agent-derived from `docs/design-system.md` and the current code; the Figma nodes of ui-kit #244/#269/#245 (`6977-4058`, `6977-3825`, `6977-3745`) could not be read, so **every small dimension below is a proposal for the owner to confirm against Figma** (a token value edit, nothing else). Values read from `packages/ui-components/src/cunningham-tokens.css`.

## Screen(s)
Anatomy of one control (unchanged; only the numbers shrink). The root `<label class="c__checkbox ...">` is the hit area:

```
Checkbox / Radio                          Switch (labelSide="left", default)
+--------------------------------+        +----------------------------------+
| pad 4 + border 1               |        | Label text      [ rail  (o ) ]   |
|  [ box ] 8px  Label text       |        |                                  |
|  hint text (indented under     |        | hint text (not indented)         |
|   the label, = box + 8px)      |        +----------------------------------+
+--------------------------------+        labelSide="right": rail first, hint
                                          indented by rail width + 8px
```
Sizes (the only new thing): `medium` (default, current rendering, pixel-identical) and `small`.

- API: `size?: "medium" | "small"` on `Checkbox`, `Radio`, `Switch`, default `"medium"`, same name and default as `Button`. `small` adds the class `c__checkbox--small` to the root label (Radio and Switch already carry `c__checkbox`). `medium` adds **no** class, so default markup and CSS are byte-identical for existing callers. `size` is removed from the forwarded `<input>` props and from the inherited HTML attributes (`Omit<InputHTMLAttributes<HTMLInputElement>, "size">`).
- Same prop on `CheckboxGroup` / `RadioGroup`: **not offered** (set per control; a group-level default is an additive later change).

## Mockup
None, on purpose: three controls resized, fully described by the token table below; the stories (`forms/*/index.stories.tsx`, small variants side by side with medium) are the visual reference. Execute builds with the real tokens.

## Reused components (from the design system)
- `Field` (shared wrapper, hint text and `state` colours) — untouched, still `compact`.
- Checkbox tokens by Radio — Radio keeps an empty `tokens.ts` and reads `--c--components--forms-checkbox--*`; the radio small box reads `small-size` from the checkbox table. **No `forms-radio` key, no parallel token.**
- `Button` is the convention model (`size` union, modifier class, `small-*` keys in the existing table).

## Tokens
Only `small-*` keys added to **existing** tables. Emitted as `--c--components--<table>--<key>` in the six themes by `yarn build-theme`; no colour key is added, so the six themes (`default`, `dark`, `dsfr-light`, `dsfr-dark`, `anct-light`, `anct-dark`) follow with no per-theme code.

`forms/checkbox/tokens.ts` (table `forms-checkbox`, read by Checkbox **and** Radio):

| Key | Value | Resolved | Role |
|---|---|---|---|
| `small-size` | `1rem` (literal) | 16px | box edge (checkbox, radio), also the check/indeterminate SVG edge and the radio dot reference |
| `small-font-size` | `globals.font.sizes.xs` | 0.75rem | label text (checkbox, radio **and switch**) |

`forms/switch/tokens.ts` (table `forms-switch`):

| Key | Value | Resolved | Role |
|---|---|---|---|
| `small-rail-width` | `2rem` (literal) | 32px | rail width |
| `small-rail-height` | `1rem` (literal) | 16px | rail height |
| `small-handle-size` | `0.75rem` (literal) | 12px | handle diameter |
| `small-handle-offset` | `globals.spacings.4xs` | 0.125rem = 2px | inset of the handle from the rail edge (all sides) |

Derived in SCSS, no token: switch travel = `calc(rail-width - handle-size - 2 * handle-offset)` = 16px; radio dot = `calc(var(--c--components--forms-checkbox--small-size) * 2 / 3)` = 10.67px (the same 2/3 ratio as the default 1rem in 1.5rem, so the default value stays the existing `1rem`); gap to label = `globals.spacings.xs` (0.5rem, equal to the default literal); footer indent = `small-size + gap` (checkbox, radio) or `small-rail-width + gap` (switch, `labelSide="right"`).

| Element | medium (unchanged) | small |
|---|---|---|
| Checkbox / Radio box | 24px (`size`) | 16px (`small-size`) |
| Check / indeterminate SVG | 24px attrs | 16px, set by CSS to `small-size` (viewBox scales the mark) |
| Radio dot | 16px literal | 10.67px (2/3 of the box) |
| Switch rail | 45 x 24px literals | 32 x 16px |
| Switch handle | 18px, left 4 top 3, travel 20px literals | 12px, inset 2px, travel 16px |
| Gap control to label | 0.5rem | 0.5rem (`spacings.xs`) |
| Label font | 0.875rem (`sm`) | 0.75rem (`xs`) |
| Hint text | 0.75rem (`forms-field--font-size`) | 0.75rem — **unchanged**, already small |
| Shell padding / border | 4px / 1px transparent | unchanged |

## Interactive area (>= 24 x 24 px)
- The hit area is the whole root `<label>`; its padding (4px) and border (1px) are kept in the small size. A label-less small checkbox or radio is `16 + 8 + 2 = 26 x 26`; a small switch `32 + 10 = 42 x 26`. **No pseudo-element and no new rule is needed**; the 24px floor holds as long as `small-size` (and `small-rail-height`) >= 14px with the current shell. The token comments state this constraint.
- The rule is verified in a real browser (Playwright CT, chromium): `boundingBox()` of each small root label >= 24 x 24, and a click on the label padding (outside the visible box) toggles the input. Vitest cannot measure (jsdom), so it checks only the class and the token existence.
- A control with label text only grows the hit area; disabled controls keep `pointer-events: none` (not operable by design).

## States
All states reuse the existing selectors; only the dimension variables differ. Nothing is invented.

| State | Rendering in small |
|---|---|
| default | box `small-size`, existing border width/colour tokens, radius `forms-checkbox--border-radius` (2px) |
| hover | existing 1px `box-shadow` ring on the input (`border-width--hover`), unchanged |
| focus (keyboard and click) | the shell's `:focus-within` border + 1px ring on the **label** (existing), plus the input's `:focus` ring; independent of the control size, so kept as is. It is `:focus-within`, not `:focus-visible` (existing behaviour, not changed here) |
| checked | accent background; SVG check at `small-size` |
| indeterminate (checkbox) | accent background; SVG dash at `small-size` |
| disabled | existing disabled colours, `pointer-events: none` |
| error / success | existing `.c__field--error|success` colouring of hint text and label; unchanged |
| radio checked | dot = 2/3 box in accent colour, scale transition unchanged |
| switch checked | rail accent, handle translated by the derived travel; transition unchanged |
| with / without label, with hint text | label at `small-font-size`; hint text indent follows the control width |
| `labelSide` (switch) | `left` (default) and `right` keep working: row-reverse and the right footer indent are recomputed from `small-rail-width` |

## Themes and dark
Colours come from the existing contextual tokens used by the default size, so the six themes work without change; the 16px box and 12px handle keep the same colour pairs (contrast unchanged: box border `neutral.tertiary` against the surface, unchecked handle `contextual.primary` against the neutral rail). The small size does not alter any colour.

## Responsive behaviour
No breakpoint. Fixed small dimensions; the label wraps as today.

## Accessibility contract (RGAA / WCAG 2.2)
- Native `<input type="checkbox|radio">` inside a `<label>`; role, name, state, keyboard (Space on checkbox/switch, arrows within a radio group) are native and untouched. Switch keeps its checkbox role as today.
- Target size >= 24 x 24 px (WCAG 2.5.8 AA) met by the label shell and checked by a test; focus ring visible (WCAG 2.4.7) kept.
- Hint text stays inside the `<label>` as today; no `aria-*` is added.
- Storybook a11y addon: no violation on any new story, in the `default`, `dark` and `dsfr-light` themes.

## i18n
None. No string added; `src/locales/*.json` untouched.

## What stays out
- No `nano`/other sizes, no `size` on `CheckboxGroup`/`RadioGroup`/`Field`, no per-state recolouring, no new focus ring (`:focus-visible` migration), no widening of `Switch` `label` to `ReactNode`, no density mode on `Input`/`Select`, no change of the default dimensions, no pseudo-element hit-area enlargement, no `forms-radio` keys, no ADR.

## Design system gaps
Reported, **not** filled by invention; the owner confirms at the plan checkpoint.
1. **No size scale for form controls and no hit-area token.** `docs/design-system.md` lists Button heights (40/32/24) but nothing for boxes, rails or handles. The small values are component literals in the existing tables (like Button's `small-height: 32px`), and the 24px floor is enforced by a test, not a token.
2. **Figma not read.** Box 16px, label 12px, rail 32x16, handle 12px, inset 2px are proposals consistent with the 24px floor (see "Interactive area"); the three Figma nodes decide.
3. **Default switch dimensions and the radio dot are SCSS literals** (45x24, 18, 4, 3, 20, `1rem`), not tokens. Left as is to keep the default pixel-identical; tokenising them is a separate cleanup (it would only change the source of the same values).
4. **Radio dot at small size is 10.67px** (fractional): derived by ratio to avoid a parallel token; a rounded 10px/12px would need a `radio-dot` key in the checkbox table.
