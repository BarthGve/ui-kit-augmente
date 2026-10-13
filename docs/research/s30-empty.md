# Research — Story s30-empty

Worktree `.worktrees/s30-empty`, branch `feature/s30-empty` (from `next` at `b009199a`). Source read only. `docs/reviews/stories.md`: `Stories ready: yes`.

## The five structuring facts
1. **Premise "no equivalent" is partly true.** No `components/empty/`. The only empty states are ad hoc: `DataGrid` (`data-grid/index.tsx:171-182`, class `c__datagrid__empty-placeholder`, a `div` with `fs-h3 fw-bold`, optional image, label and `emptyCta`, no heading element), `SearchFilter` empty row, `Gantt` (`gantt/index.scss:739`) and `quick-search`. They stay untouched: s30 only adds a component; migrating DataGrid to it is a separate story (not requested).
2. **Pure presentational component, no dependency, no ADR.** `div.c__empty` with four slots: `media` (icon/image), `title` as a real heading of level `headingLevel`, `description`, `actions`. No React Aria primitive applies; `Heading` from `react-aria-components` is already used by Accordion (`accordion/Accordion.tsx:63`) but a plain `createElement("h"+level)` is enough and avoids the RAC context; either is fine, pick RAC `Heading` for consistency.
3. **No `role`**: AC2 says "no role beyond a landmark-free group": root is a plain `div` (a `role="group"` only if the consumer passes `aria-label`/`aria-labelledby`; default none). Title is a heading, level chosen by caller, **required** (no safe default level: a wrong default breaks the page outline); proposed default `3` as Accordion does, overridable. Open question 1.
4. **Reuse `Button` for the action** is a consumer concern: `actions` is a `ReactNode` slot, the stories show `Button`. The component imports nothing from Button (YAGNI, no coupling).
5. **No i18n key**: all text is consumer content; media is decorative or the consumer's own `alt`. Nothing in `src/locales`. Tokens: contextual global tokens exist for title (`content.semantic.neutral.primary`), description (`…neutral.secondary`) and media (`…neutral.tertiary`); spacing `globals.spacings`; no new global needed except a media size (literal, gap).

## Target story
s30-empty (docs/stories.md:531), complexity 1. As a user facing a list with no content I want an empty state so that I understand why nothing is shown and what to do next.
- AC1 `Empty` renders an optional icon or media slot, a title, a description and an optional action area.
- AC2 Presentational: no `role` beyond a landmark-free group; the title is a heading level chosen by the caller (`headingLevel`).
- AC3 Spacing and colours come from tokens; works in the six themes.
Dependencies: none. Notes: shadcn Empty; free of data logic; likely reuses `Button` for the action.

## Current state of the code
- Models: `card/` (slots header/body/footer, `tokens.ts`, mdx, spec), `accordion/` (`Heading` with `headingLevel`), `timeline/` (latest: tokens, 5-locale pattern, contrast guard `Timeline.spec.tsx`, `e2e` helper).
- Registration points: `cunningham.ts` (import + key `empty`), `src/library.scss` (`@use`), `src/index.ts` (values + `export type`).
- Tokens available (`cunningham-tokens.css`): `contextuals.content.semantic.neutral.{primary,secondary,tertiary}`, `globals.spacings.*`, `globals.font.weights.*`.

## Anchor points
New `components/empty/{index.tsx,Empty.tsx,types.ts,tokens.ts,index.scss,empty.stories.tsx,Empty.mdx,Empty.spec.tsx}`; `cunningham.ts`; `src/library.scss`; `src/index.ts`; one `minor` changeset; `yarn build-theme`.

## Verified APIs / functions
`Heading` (react-aria-components, `level` 1–6); `clsx`; `DefaultTokens`; the Card/Timeline spec technique (textual stylesheet guard, token existence in six themes, six-theme contrast).

## Traps & constraints
- **Heading level is a prop, not hard-coded**; test every level 1–6 renders the matching `h1`–`h6`.
- **Empty slots must not render empty wrappers**: media, description, actions absent = no element (otherwise stray gaps and empty landmarks).
- **Colour of media**: if the media is an `Icon`, it inherits `currentColor`; contrast of the title/description in six themes (>= 4.5:1), media is decorative (the consumer sets `aria-hidden`; the slot does not add it, a documented choice).
- `cunningham-tokens-sass.scss`: restore the tracked version and hand-add only new blocks, diff-verified (t01 s17 precedent).
- No literal colour/spacing; literals only in `tokens.ts` (media size).
- Out of scope: migrating `DataGrid`'s placeholder, illustrations, i18n.

## Open questions
1. Default `headingLevel`: proposed `3` (as Accordion).
2. Alignment: centred column (proposed, usual empty state); `align` prop not added (YAGNI).
3. Media size token: literal `3rem`? proposed as a component literal (gap).

## Real complexity
Story says 1; **stays 1**. One ticket: component, tokens, stories, tests, changeset.

## Split proposal
None.
