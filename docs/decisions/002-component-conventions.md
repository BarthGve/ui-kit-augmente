# ADR 002 — New components follow the existing ui-kit component conventions

- Status: accepted
- Date: 2026-10-09
- Scope: framing

## Context
The PRD requires that every addition respects all the constraints of the existing product and stays acceptable upstream. ui-kit already has a consistent way of building components (folder layout, `c__` BEM classes, tokens declared in `cunningham.ts`, React Aria primitives, five locales checked by `check-locales`, Storybook, Vitest, changesets). Without a decision, the 24 stories could introduce parallel styling or testing approaches.

## Decision
Every new or changed component follows the conventions listed under "Patterns & conventions" in docs/architecture.md. No new dependency for styling, state, accessibility or testing is added without a new ADR; the dependency already in the repo that covers the need is used (React Aria, `@dnd-kit`, `@tanstack/react-table`, `@internationalized/date`).

## Considered options
- Follow the existing conventions — chosen.
- Introduce a new styling approach (CSS modules, CSS-in-JS) for new components — rejected because it breaks the token pipeline and would not be accepted upstream.
- Pick new libraries per component (for example a Gantt library) without a record — rejected because a heavy dependency is a structural decision; it needs its own ADR at research time (`/dm-research` for s22 to s24).

## Consequences
Easier: reviews check one checklist, and components are consistent. Harder: the Gantt (s22 to s24), Combobox (s19) and Upload module (s20) may need a library decision, which must be taken explicitly before planning. To watch: the `form/` versus `forms/` folder split and the `baseBranch: "main"` of Changesets, noted in docs/architecture.md.
