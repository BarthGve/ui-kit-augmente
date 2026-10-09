# Design — Story s26-alert-modal

Component story, one dialog. Agent-derived from `docs/design-system.md` and `docs/research/s26-alert-modal.md`; **to be reviewed by the owner before planning and before any code**. Values read from `packages/ui-components/src/cunningham-tokens.css`.

## Screen(s)
Anatomy of one `AlertModal`: the existing `Modal` (size small, default layout) with a fixed content recipe.

```
+--------------------------------------------+  .c__modal  role="alertdialog"
| (icon)  Title                              |  .c__modal__title   icon aria-hidden, id on the title text
|                                            |
| Message (aria-describedby target)          |  .c__modal__content__text   id on the message node
| [optional details, outside the description]|
|                                            |
|              [ Dismiss ]  [ Primary ]      |  .c__modal__footer__right
+--------------------------------------------+
```
- **Icon by severity**, left of the title, 1.5rem, colour `content.semantic.<sev>.tertiary` (the existing `.modal-message-<sev>-icon` rule): info `info`, success `check_circle`, warning `error_outline`, error `cancel` (Material ligatures via `iconFromType`, same as `MessageModal`; icon set is open question 2 of the research). The icon is **decorative: `aria-hidden="true"`**; the meaning is carried by the title, the shape differs per severity, and colour is never the only cue.
- **Title**: caller-provided `ReactNode`, rendered in `.c__modal__title` (18px, weight 600). The `id` for `aria-labelledby` sits on a `<span>` around the title text only (not on the row, so the icon is not part of the name).
- **Message**: `children`, caller-provided, rendered in `.c__modal__content__text` (14px, regular). Its `id` is the `aria-describedby` target.
- **Details** (optional, `details` prop): extra content rendered **after** the message, outside the described node, so it is not read as part of the description (a list, a link). Omitted -> no wrapper.
- **Actions** (footer, right aligned, stacked in a column under the `sm` breakpoint, as today):
  - dismiss action, always present, first in DOM order;
  - optional primary action, second in DOM order.
- **No close "X"** (`hideCloseButton`): the dismiss action is the single, explicit way to close besides Escape. The X has a hard-coded English `aria-label="close"` in `ModalDefaultLayout.tsx:38,52`, which must not leak into an alert.
- Size: `ModalSize.SMALL` (300px) by default; `MEDIUM` (600px) allowed for long messages. No other size.
- Backdrop, radius, shadow, padding, surface and text colours: those of `Modal` (unchanged).
- Variants: **none** besides the four severities. No tinted modal surface (the `Alert` tints its own box; a dialog keeps the neutral surface, like `MessageModal`).

## Mockup
`docs/designs/s26-alert-modal.html` — visual reference, static (no script), light and dark, four severities, with and without a primary action, initial-focus ring shown. DO NOT copy into production: Execute builds with the real `Modal` and `Button`. Icons in the mockup are inline SVG stand-ins for the Material ligatures.

## API shape
Consistent with `MessageModal` / `Modal` (props names `isOpen`, `onClose`, `closeOnClickOutside`, `size` already exist on `Modal`; nothing is renamed).

```ts
type AlertModalSeverity = Exclude<VariantType, VariantType.NEUTRAL>; // info | success | warning | error

type AlertModalProps = {
  isOpen: boolean;
  onClose: () => void;               // dismiss action, Escape, and (opt-in) outside click
  severity?: AlertModalSeverity;     // default VariantType.INFO
  title: ReactNode;
  children: ReactNode;               // the message (aria-describedby)
  details?: ReactNode;               // optional, not described
  primaryAction?: { label: string; onClick: () => void };
  dismissLabel?: string;             // default from locales (see i18n)
  closeOnClickOutside?: boolean;     // default false (opt-in), same name as Modal
  size?: ModalSize.SMALL | ModalSize.MEDIUM; // default SMALL
};
```
- `primaryAction.onClick` does **not** call `onClose`: the caller decides (it may keep the alert open while it works), as `Alert.primaryOnClick` does. Open question for the owner (research Q5).
- `Modal` gets three **additive optional props**: `role`, `aria-labelledby`, `aria-describedby`, forwarded to react-modal (`role`, `aria`). `Modal` skips its `aria-label` (derived from the title) when `aria-labelledby` is given. Without them nothing changes.
- Escape: `closeOnEsc` stays at the `Modal` default (true) and calls `onClose`; `preventClose` is not exposed (an alert must always have a way out).

## Reused components (from the design system)
- **Modal** — the dialog shell, backdrop, portal, focus trap, Escape, scroll lock (unchanged apart from the three additive props).
- **Button** — dismiss: `variant="bordered" color="neutral"` when a primary action exists, otherwise `variant="primary" color=<severity>`; primary action: `variant="primary" color=<severity>`; both `fullWidth` like `ConfirmationModal`. The initial-focus button gets `autoFocus`.
- **Alert** — only its severity vocabulary (`VariantType`), icon helper `iconFromType` and the semantic tokens; no `Alert` component is rendered.
- **MessageModal** — visual precedent for the title icon; left untouched.

## States
| State | Rendering |
|---|---|
| closed | nothing rendered (as `Modal`) |
| open, with primary action | icon + title + message + `[Dismiss] [Primary]`; focus on the primary button (ring visible if the user is on keyboard) |
| open, dismiss only | icon + title + message + `[Dismiss]` (severity coloured); focus on it |
| hover / active / focus-visible / disabled | those of `Button`; the alert modal adds none |
| long message | wraps in `.c__modal__content__text`; the modal scrolls inside `.c__modal__scroller` like `Modal` |
| long title | wraps; the icon stays at the first line start |
| reduced motion | `Modal` has no entry animation; nothing to add |
| forced colors | native `Button` and border styles; icon follows `currentColor`-like system colours of the ligature font. To be eyeballed in Storybook (no custom code) |

Loading/empty/error/success of the *content*: not applicable (presentational; "error" and "success" are severities, not states).

## Tokens
**No new token.** Everything is existing:
| Need | Token |
|---|---|
| surface, border, radius, shadow, padding, width, backdrop | `--c--components--modal--*` (unchanged) |
| icon colour | `--c--contextuals--content--semantic--<sev>--tertiary` via `.modal-message-<sev>-icon` (existing rule, `modal/_index.scss:119-137`) |
| button colours, focus ring | `Button` recipes: `--c--contextuals--background--semantic--<sev>--primary`, `…content--semantic--<sev>--on-<sev>`, ring `…border--semantic--<sev>--primary` |
| text | `--c--components--modal--color`, `…content-*` |

`--c--components--alert-modal--*` is **not** needed: no value is specific to the alert modal. If review asks for a tinted header or an icon chip, that is a new token set and a new decision (see gaps).

Resolved values (light / dark), read from `cunningham-tokens.css`: icon info `#0069CF` / `#8DBDEF`, success `#027B3E` / `#86C597`, warning `#BC4200` / `#E8AE8A`, error `#D7010E` / `#EEA99D`; surface `#FFFFFF` / `#25252F`; text `#25252F` / `#F0F0F3`; border `#E2E2EA` / `#3A3A4C`.

## Dark theme and the six themes
- All colours are contextual tokens, so `dark`, `dsfr-light`, `dsfr-dark`, `anct-light`, `anct-dark` follow with no per-theme code. The mockup shows `default` and `dark`.
- Icon contrast (non-text, 3:1 against the surface) is the existing `content.semantic.<sev>.tertiary` pairing used by `MessageModal`; t02 verifies it numerically in the six themes with the technique of `button/focus-ring.spec.tsx` (resolve the `var()` chains from `cunningham-tokens.css`).
- Fonts: Hanken Grotesk in the default theme, Marianne in DSFR/ANCT; inherited from the page, not set by the component.

## Responsive behaviour
Inherited from `Modal`: `.c__modal--small` is 300px, `calc(100vw - 1rem)` under `sm`; the footer stacks in a column under `sm` with full-width buttons, DOM order kept (dismiss on top, primary below). At very narrow widths the message wraps; no horizontal scroll. Nothing added.

## Accessibility contract (RGAA / WCAG 2.2)
- Root `role="alertdialog"` + `aria-modal="true"` (react-modal) with `aria-labelledby` = title text id and `aria-describedby` = message id; **no `aria-label`** on it. Assistive tech announces the title then the message on open.
- Focus: moves into the modal on open, **first to the primary action when present, otherwise to the dismiss action** (`autoFocus`; hypothesis to prove with the first red test); Tab and Shift+Tab loop inside (react-modal `scopeTab`); on close focus returns to the opener (react-modal focus manager). Outside content is `aria-hidden` (existing `ariaHideApp` on `.c__app`).
- Keyboard: Tab / Shift+Tab, Enter / Space on a button, **Escape calls `onClose`**. Outside click closes only with `closeOnClickOutside`.
- Decorative icon `aria-hidden="true"`; every control has a visible text name (no icon-only button; the X is hidden).
- Visible focus on buttons: the existing `Button` ring (>= 3:1).
- Open question for the owner: for a destructive (error) alert with a primary "Delete", APG advises focusing the least destructive control; AC says primary (research Q1).
- Storybook a11y addon / axe: no violation on every story in `default`, `dark`, `dsfr-light`.

## i18n
Default labels, **no new key proposed** (all five locales already carry them):
| Where | Key | en-US / fr-FR |
|---|---|---|
| sole dismiss action | `components.modals.helpers.disclaimer.ok` | Ok / Ok |
| dismiss next to a primary action | `components.modals.helpers.confirmation.cancel` | Cancel / Annuler |
`dismissLabel` overrides either. Title, message, details and primary label are caller strings. If the owner prefers dedicated keys (`components.modals.alert.dismiss|cancel`), t02 adds them to the five files and runs `yarn check-locales` (research Q3).

## Usage
- **Standalone** (a state hook, inside `CunninghamProvider`, which mounts `ModalProvider`; `Modal` throws without one):
  ```tsx
  const modal = useModal();
  <Button onClick={modal.open}>Delete</Button>
  <AlertModal {...modal} severity={VariantType.ERROR} title="Delete this file?"
    primaryAction={{ label: "Delete", onClick: () => { remove(); modal.close(); } }}>
    This cannot be undone.
  </AlertModal>
  ```
- **In a `ModalProvider` flow**: the modal is rendered in the provider's portal either way (it is a `Modal`). No `useModals().alertModal()` helper in this story (research Q4); a promise-style flow can be built by the caller with the same props.

## Out of scope
Provider helper `alertModal()`, a `neutral` severity, a close "X", stacking several alerts, auto-dismiss/timer, custom icon, size `large`/`full`/`tab` layout, any change to `Alert`, `MessageModal`, `ConfirmationModal`, `DeleteConfirmationModal`, `ModalProvider`.

## Design system gaps
Reported, **not** filled by invention.
1. **No severity icon component / token.** Alert has two icon sets (SVG in the exported wrapper, which also maps `info` to the error icon; Material ligatures elsewhere). AlertModal follows `MessageModal` (ligatures). A shared severity-icon component is a separate story.
2. **No tinted-surface or icon-chip pattern for dialogs.** Alert tints its box; Modal never does. The design keeps the neutral surface; a tinted header would need new tokens and an owner decision.
3. **Modal close "X" is not localised** (`aria-label="close"` hard-coded). Avoided here by hiding it; fixing it is outside the story.
4. **`Button` medium height**: `docs/design-system.md` says 40px, `button/tokens.ts` says `medium-height` 48px. The mockup draws 40px; the implementation uses the real `Button`, so the mockup button height is indicative.
5. **Initial-focus on a destructive primary** is an accessibility choice the design system does not settle (open question 1).


## Revision 2026-10-09 — owner's reference image (shadcn alert dialog)
The owner asked to take inspiration from a reference: a compact dialog with a title, a muted description, a **divider**, then a footer with **right-aligned** actions (dismiss as a bordered button, then the primary action). Changes to the design above:
- **Severity is optional, default none (neutral).** Without `severity` there is no icon and the primary button uses the neutral inverse style (as in the reference). With a severity the icon (aria-hidden) precedes the title and the primary button takes the semantic colour. The four severities of the acceptance criteria stay available.
- **Layout:** body (title + muted message) then a footer separated by a 1px border; footer actions **right-aligned**, natural width (not `fullWidth`), dismiss first, primary last; on narrow screens the footer stacks with the primary action on top.
- **Surface:** the radius is **the project's modal radius**, `var(--c--components--modal--border-radius)` (8px), the same value and token as `Modal` (no 12px as in the reference image); same elevation token as `Modal`; message in the muted content colour; buttons keep the `Button` radius (4px). Only the footer padding is a literal without a global token (design-system gap).
- API: `severity?` has no default (was `info`); everything else unchanged. Default labels, focus rule and open questions unchanged.
- Mockup `s26-alert-modal.html` redrawn (v2): neutral reference case, four severities, dismiss-only case, light and dark.

## Revision 2 — shadcn Alert Dialog page (https://ui.shadcn.com/docs/components/base/alert-dialog)
Facts read on the page: parts root / trigger / content / header (optional media, title, description) / footer (cancel first, action second); the only documented prop is `size` on the content, `"default" | "sm"`; examples: default, small, with media (icon), small with media, destructive ("Delete Chat"), RTL. The page documents nothing about role, focus, Escape or outside click (delegated to Base UI). Adopted here:
- `size`: `"default" | "sm"` alongside the existing `Modal` sizes (small is the narrower layout).
- `media?: ReactNode` slot in the header, above the title, replacing the severity icon when provided.
- Destructive case = `severity="error"` with the primary action in the error colour.
- RTL: verify with the Direction story (s53) once it exists.
Not adopted: a trigger part (the repo opens modals through `isOpen` / `ModalProvider`).

## Revision 3 — radius (owner)
The owner required the radius to match the project's modals: `AlertModal` reuses `--c--components--modal--border-radius` (8px) and adds no radius token. Mockup updated (8px modal, 4px buttons like `Button`).
