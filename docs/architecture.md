# Architecture — ui-kit-augmente

Base: fork of `suitenumerique/ui-kit` (see docs/decisions/001-fork-ui-kit-as-base.md). The stack is imposed by the boilerplate; this document maps it and does not change it. Every claim below was read in the code on 2026-10-09 (ui-components 1.3.0, ui-tokens 3.2.0).

## Stack
- TypeScript 5 (strict), React 19 (types pinned `@types/react` 19.1.8), React Aria Components (`react-aria-components`, `@react-aria/*`, `@react-stately/*`) as the accessible primitives.
- SCSS and CSS custom properties, generated tokens (`cunningham` CLI from `@gouvfr-lasuite/ui-tokens`).
- Build: Vite (library mode, `vite-plugin-dts`), output `dist/` with `index`, `icons`, one `style.css`, fonts. Every dependency and peer dependency is external to the bundle.
- Tests: Vitest + jsdom + Testing Library (`yarn test`), Playwright component tests under `e2e/` (`yarn test:ct`).
- Docs: Storybook 8 (react-vite) with the a11y addon; MDX pages per component.
- Monorepo: Yarn 1.22.22 workspaces + Turborepo; releases through Changesets; Node 24 (`.nvmrc`).
- Drag and drop: `@dnd-kit/*`. Tables: `@tanstack/react-table`. Dates: `@internationalized/date`.

## Repo structure
- `packages/ui-components/` — the React component library (published as `@gouvfr-lasuite/ui-components`).
  - `src/components/<component>/` — one folder per component, lower-case and hyphenated.
  - `src/hooks/` — shared hooks (`useControllableState`, `useArrowRoving`, `useResponsive`, …). `src/utils/` — shared helpers and SCSS partials (`_accessibility.scss`, `_responsive.scss`).
  - `src/locales/` — `en-US`, `fr-FR`, `de-DE`, `es-ES`, `nl-NL` JSON files.
  - `cunningham.ts` (package root) — token configuration: imports each component's `tokens.ts`, merges overrides.
  - `src/cunningham-tokens.*` — generated files (ignored by the linter): never edit.
  - `src/index.ts` (public exports), `src/cunningham.ts` (re-exports of the legacy Cunningham components), `src/library.scss` (every component stylesheet), `src/index.scss`.
  - `e2e/` — Playwright component tests; `.storybook/` — Storybook config.
- `packages/ui-tokens/` — token engine, CLI and default tokens (`src/lib/cunningham-tokens.ts`).
- `packages/ui-codemod/` — one-off migration CLI. Out of scope for this fork (PRD graveyard).
- `docs/` — driven pipeline documents; `.changeset/` — pending release notes.

## Patterns & conventions
Rules a new component must follow (verified on `badge`, `tabs`, `separator`, `storage-gauge`, `modal`):
1. **Folder** `src/components/<name>/` holds `index.tsx` (re-exports), the component `.tsx`, `types.ts` when types are shared, `index.scss`, `<name>.stories.tsx` (or `index.stories.tsx`), optional `<Name>.mdx`, and `*.spec.tsx` for Vitest.
2. **Styling** is SCSS with BEM classes prefixed `c__` (`c__badge`, `c__badge--uppercased`, `c__badge--accent`), built with `clsx`. Values come only from CSS variables named `--c--components--<component>--<property>`; no literal colour, spacing or radius.
3. **Tokens**: a component's variables are declared in `packages/ui-components/cunningham.ts`, either from a `tokens.ts` (`export const tokens = (defaults: DefaultTokens) => ({...})`, registered in `componentTokenDefaults`) or inline in its `components` block (as `badge`). Values reference the global tokens through `ref(globals…)` / `ref(contextuals…)`. Run `yarn build-theme` to regenerate.
4. **Registration**: add `@use "./components/<name>";` to `src/library.scss` and the exports to `src/index.ts` (value exports and `export type` for props).
5. **Accessibility**: build on `react-aria-components` when a primitive exists (as `Tabs`); props document themselves with JSDoc; `aria-label` or `aria-labelledby` is required when there is no visible label.
6. **State**: expose controlled and uncontrolled modes with `useControllableState` (`defaultX`, `x`, `onXChange`).
7. **i18n**: user-visible strings come from `src/locales/*.json` through `useCunningham()` / `useCustomTranslations`; every key must exist in all five locales (`yarn check-locales` fails CI otherwise).
8. **Icons**: `Icon` component (`components/icon`), Material icons or SVG; no emoji.
9. **Stories and docs**: Storybook `title: "Components/<Name>"`, `tags: ["autodocs"]`; an `.mdx` page when the component has rules to explain.
10. **Release**: one changeset per change in `.changeset/` (package `@gouvfr-lasuite/ui-components`).

Traps found while reading:
- Form components are split across two folders: the TSX and `tokens.ts` live in `components/forms/<name>/`, but their SCSS and stories live in `components/form/<name>/` (see `library.scss`). Do not assume one folder per form component.
- Legacy Cunningham components are exported through `src/cunningham.ts`; recent components are exported straight from `src/index.ts`.
- `components/forms/radio/tokens.ts` returns an empty object (radio reuses checkbox tokens).
- Two `FileUploader` locations exist (`components/form/file-uploader`, and the legacy one under `forms/`): check which is current before reusing.
- `.changeset/config.json` has `baseBranch: "main"`, while this fork integrates on `next`: changeset status checks must be run against `next` explicitly.

## Data model
None. The library holds no persistent data; components are controlled by props and callbacks. Components that fetch (waffle widget, file preview PDF worker) receive their URLs through props.

## Integration points
- Consumers: La Suite applications (Docs, Drive, Meet…) through npm: `@gouvfr-lasuite/ui-components` and `@gouvfr-lasuite/ui-tokens`.
- External services: none required by the library itself (the waffle loads a remote widget through `widgetPath`).
- Build and release: Changesets and `.github/workflows/main.yml` (lint, locales, tests, build). GitHub Actions are disabled on this fork by `/dm-init`; the same checks (`yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`) must be run locally before a PR.
- Design reference outside the repo: the design-system artifact (https://claude.ai/artifact/XF7u4R6KevkT1uErAcxGfP), updated per ticket (PRD amendment 2026-10-09).

## Design / UX
Visual rules come from the tokens and from the approved designs referenced by the ui-kit issues in docs/stories.md. The global design system document `docs/design-system.md` is produced by `/dm-design-system` (next step); the artifact above is the visual reference until then.
