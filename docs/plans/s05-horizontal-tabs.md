---
validated: yes
---
# Plan — Story s05-horizontal-tabs

Branch: `feature/s05-horizontal-tabs` (framing) · ticket: `feature/s05-horizontal-tabs/<ticket-id>`
Research: `docs/research/s05-horizontal-tabs.md` — read it first. Design: `docs/designs/s05-horizontal-tabs.md`.

## Target story
**As a** user navigating sections of a page **I want** the new horizontal tabs **so that** navigation matches the approved design. Complexity 2 in stories.md, **1 after research**.
**The premise is false**: the two designs of ui-kit #231 (Classic, Line) are already shipped as `variant="default"` and `variant="line"` (commit `3b5e9d4e`). Adding a variant would duplicate one of them. Replacement ticket: the smallest useful one, which makes each AC **provable** (Tabs has no Vitest spec, no snapshot, no viewport-level overflow test) without touching the shipped output. If the owner wants a different look (research open question 2), that is a new decision and a new story, not this plan.

Acceptance criteria (docs/stories.md), as reinterpreted:
- AC1 `Tabs` offers the horizontal appearance through `variant` (`default` = Classic, `line` = Line), with a Storybook story and a snapshot test, current variants unchanged.
- AC2 Arrow keys move between tabs; automatic and manual activation work.
- AC3 The tab list does not overflow on a narrow viewport.

## Tickets (ordered)
### t01-tabs-contract-guard
- **size:** S
- **estimate:** 1d
- **depends on:** none
- **scope:** tests and docs only. New `components/tabs/Tabs.spec.tsx` (jsdom), additions to `e2e/tabs/tabs.spec.tsx` (CT), a sentence in `Tabs.mdx`. **No change to `Tabs.tsx`, `index.scss`, `types.ts`, tokens or stories' output.** Covers AC1 to AC3.

Tasks (every test here guards existing behaviour, so it is green from the start; each is **proven able to fail by a mutation** that is reverted, recorded in the PR; no `it.fails` ships):
1. [ ] Write `Tabs.spec.tsx` (import `it` from `vitest`, `TZ=UTC`) — AC1 DOM guard: for `default` and `line`, render 3 tabs and assert, after replacing react-aria generated ids (`react-aria\d+-…`) by `ID`, the exact `container.innerHTML` via `toMatchInlineSnapshot` (inline: no `__snapshots__` file, no dependency): root classes `c__tabs c__tabs--<variant>`, `role=tablist` with the label, `role=tab` with `aria-selected`, one `.c__tabs__indicator` only for `line` and inside the selected tab only, one `tabpanel`; plus `fullWidth` adds `c__tabs--full-width`; `variant` defaults to `default`. Mutations: rename `c__tabs--line`, render the indicator for `default`, drop `aria-selected`: each turns a test red.
2. [ ] Same file — AC1 stylesheet guard (read `index.scss` from disk, technique of s10/s11, vitest stubs stylesheets): assert the exact declarations of the `default` rules (hover/selected `overlay--primary` background, `neutral--tertiary` rest text, `neutral--primary` selected text), of the `&--line &__tab` block (transparent background, `neutral--primary`, padding-block `xxs`, radius `xs`) and of `__indicator` (`height: 1.5px`, `currentColor`, transition `none` under `prefers-reduced-motion`), the ring (`outline: 2px solid` `brand--primary`, offset 2px), `forced-colors` rules (`Highlight`, `GrayText`), and that no hex or `rgb(` appears outside comments. Mutation: change the line's `height`, the selected token, remove the forced-colors rule: red each.
3. [ ] Same file — AC2 keyboard (userEvent): ArrowRight/ArrowLeft move focus and, in automatic mode (default and explicit), select; wrap at both ends; Home/End; a disabled tab is skipped and cannot be selected; `keyboardActivation="manual"`: arrows move focus but `aria-selected` and the panel stay, Enter then Space select (separately); `onSelectionChange` receives the id string once per selection and not on a mere focus move in manual mode; both variants (`describe.each`). Mutation: pass `keyboardActivation="automatic"` always, or drop the prop: manual tests red.
4. [ ] Same file — contrast guard in the six themes (technique of `button/focus-ring.spec.tsx`; helpers copied locally, known duplication): rest `neutral.tertiary` and selected `neutral.primary` text against surface and against `overlay.primary` composited on the surface at least 4.5:1; line indicator and ring against surface and overlay at least 3:1. **If an existing token fails, STOP and report, do not change a token** (research values: lowest 4.83, 8.11). Mutation: swap the selected text token for `border.surface.primary`: red.
5. [ ] CT first, in `e2e/tabs/tabs.spec.tsx`, for both variants — AC3: at `page.setViewportSize({ width: 320, height: 640 })` mount 5 long labels with icons at `width: 100%`; assert `document.documentElement.scrollWidth <= clientWidth` (no page overflow), the tablist `scrollWidth > clientWidth` with `overflow-x` auto, the last tab reachable by `End` and fully inside the viewport horizontally after focus (`boundingBox`), and the ring of the focused tab not clipped on the left edge (first tab focused: ring box `x >= 0`). Data-controlled size bounded: labels fixed in the test. Mutation (clear `playwright/.cache` between CSS mutations): set `overflow-x: visible` on `__list`, or `flex-shrink` on tabs: red.
6. [ ] `Tabs.mdx`: add under Variants: "`default` is the Classic tab and `line` the Line tab of the approved horizontal-tabs design (ui-kit #231)". No story change (stories `Default`, `Line`, `*WithIcons`, `FullWidth*`, `Overflow` already exist; they are AC1's Storybook evidence).
7. [ ] Run `yarn lint`, `yarn check-locales`, `TZ=UTC yarn test --concurrency=1`, `yarn build`, and `yarn test:ct` on chromium for `e2e/tabs/` (throwaway uncommitted config on the port from `bash .dm/lib/dm-port.sh`; never port 6006; stop what you started; no broad `pkill`). Restore `cunningham-tokens-sass.scss` if rewritten (nothing should be, no token changes; hand-add and diff-verify nothing). No changeset: no published output changes (stating it in the PR; if the reviewer insists, a `patch` for docs). The design-system artifact is **not** updated: no component change; the PR carries `Artifact: not applicable (tests and docs only)` and the main agent confirms whether the owner still wants a catalogue note.

## US totals
- **Person-days:** 1.0
- **Size mix:** 1×S
- Split needed: no.

## Run interdicts
- No change to the rendered output, class names, props or stylesheet of `default` and `line` (proved by tasks 1 and 2 plus `git diff --stat` showing no change in `Tabs.tsx`, `index.scss`, `types.ts`).
- No new dependency; no ADR needed (ADR 005 stays free); no breaking prop change; no new variant, token, locale key or `useControllableState` use (never modify it; wrap if ever needed).
- Do not edit generated `src/cunningham-tokens.*`.
- Hover/selected background change (research open question 2) is out of scope until the owner decides.
- A ticket never merges with a red test.

## Files touched
`components/tabs/Tabs.spec.tsx` (new), `e2e/tabs/tabs.spec.tsx`, `components/tabs/Tabs.mdx`.

## Test strategy
jsdom (Vitest + Testing Library + userEvent): DOM guard, textual stylesheet guard, keyboard, contrast. Playwright CT chromium: real layout at a 320px viewport and ring clipping. jsdom does not render SCSS, hence the textual guard. Webkit/firefox not installed locally: not verified. Lessons applied: TZ=UTC; bounded sizes; contrast in 6 themes with STOP; unmount/cleanup guarded by mutation; clear `playwright/.cache` between CSS mutations.

## Definition of Done
Single PR into `next`, structured description (including the false-premise statement and the mutation log), readable diff, lint, check-locales, `yarn test --concurrency=1`, build and CT `e2e/tabs/` green, review `Ship allowed: yes`, merged to `next`.
