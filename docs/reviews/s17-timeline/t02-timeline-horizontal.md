# Review — Ticket s17-timeline/t02-timeline-horizontal

> Diff reviewed: `git diff next...feature/s17-timeline/t02-timeline-horizontal`

## Plan compliance
- [x] Code does what the plan specifies (region wrapper, tabindex, aria-label or locale key, flex row, overflow-x, connector, stories, mdx, CT, helper). Task 5 (mutations) done by the implementer; no changeset, as planned.
- [x] Run interdicts respected: no new dependency, no new token (tokens.ts untouched; the new spec guard checks every existing token is read), generated tokens untouched (tokens-sass file modified by the build, restored), no literal in index.scss, no sorting/animation/compound API.

## Anti-hallucination
- [x] `components.timeline.region` exists in all five locales (de, en, es, fr, nl); `t()`, `useCunningham`, `TimelineEvent` export, `CunninghamProvider` path all verified.
- [x] No wrong values: CT computed 24px marker, 2px connector, >=192px items.
- [x] Code matches claims.

## Security
- [x] No injection, authz, secrets, IDOR, XSS or logging concern (static markup, text rendered by React).

## Factorization
- [x] Single `list` element reused for both orientations; no duplicated flow.

## Rules compliance
- [x] AGENTS.md conventions (BEM `c__`, tokens only, logical properties, locales x5).
- [x] No ADR contradicted.
- [x] Design system: tokens only; focus ring drawn inside the region (no ancestor clipping).

## Tests
- [x] Suite run by me: `TZ=UTC yarn test --concurrency=1` green (3 tasks); timeline spec 57 passed. CT chromium `e2e/timeline` on port 21307 (throwaway config, removed, server stopped): 4/4 pass.
- [x] AC2 covered: jsdom (region, tabindex, name, locale fallback, no wrapper in vertical, order/time unchanged) plus real-browser CT (overflow-x auto, scrollWidth > clientWidth, page does not scroll, Tab focus, 2px outline, ArrowRight scrollLeft > 0, vertical stacking).
- [x] Bite proven: removed `tabIndex={0}` -> 2 vitest tests red; `overflow-x: auto` -> `visible` -> 2 CT tests red. Both restored, `git diff --exit-code` clean.
- [x] M2 (tabindex only caught by jsdom): acceptable. `tabindex` is a DOM attribute that jsdom reads faithfully; the CT Tab-focus test would also catch it in a browser (a non-focusable region cannot be focused), so coverage is in fact doubled.
- [x] No redundant tests introduced.

## Regressions
- [x] Vertical path unchanged (default returns the bare list; test asserts no region). Other components untouched.

## Findings
- minor — Timeline.tsx — `aria-label` is applied to both the region wrapper and the inner `ol` (props spread), so screen readers announce the same name twice in horizontal mode. Harmless; consider `aria-labelledby` or leaving the list unnamed later.
- minor — index.scss — the `.c__timeline-region` rule is a second root class outside the `c__timeline` block (BEM sibling block); acceptable, noted only.

## Not verified
- Storybook a11y addon in default/dark/dsfr-light and the visual look of `Horizontal` / `HorizontalNarrow`: not rendered by me. Human: open Components/Timeline > Horizontal and HorizontalNarrow in the three themes, Tab into the row, scroll with arrows, check the focus ring and connector.
- Firefox/WebKit not run (chromium only, per plan). RTL layout (logical properties) not rendered; check with `dir="rtl"`.
- Real screen-reader announcement of the region not tested.

## Verdict
Max severity: minor
Ship allowed: yes
