# Onboarding — ui-kit fork

Fork of <https://github.com/suitenumerique/ui-kit> (remote `upstream`; no `origin` yet). ui-kit is the canonical home of the La Suite numérique design system and absorbed Cunningham (snapshot of react 4.3.1). The former Cunningham history is kept on branch `cunningham-main` / remote `cunningham`, for reference only.

## What the app does

Yarn / Turborepo monorepo with three packages:

- `@gouvfr-lasuite/ui-components` 1.3.0: all React components, SVG icons, styles, fonts, tests and Storybook;
- `@gouvfr-lasuite/ui-tokens` 3.2.0: the Cunningham token engine (CLI, default tokens, CSS/SCSS/JS/TS generators);
- `@gouvfr-lasuite/ui-codemod`: one-off migration CLI from the former package names.

Value loop: the teams of La Suite applications install the packages, theme them through tokens, then compose their screens from shared components.

## Shipped baseline

Repository active since 2025-01-14, 465 commits, last activity 2026-10-07. ui-components releases: 1.0.0 (2026-08-06), 1.1.0, 1.1.1, 1.1.2, 1.2.0 (2026-09-08), 1.3.0 (2026-10-07, `b32ebdb2`).

- From Cunningham: alert, button, calendar, data-grid, loader, modal, pagination, popover, provider, toast, tooltip; forms: checkbox, classic-label, date-picker, field, input, labelled-box, radio, select, switch, text-area.
- La Suite components: badge, context-menu, dropdown-menu, feedback-form, footer, header-banner, help-menu, hero, la-gaufre, language, layout, menu, onboarding-modal, preview, quick-search, release-note-modal, resize-handle, search-filter, separator, share, smart-scroller, storage-gauge, tabs, tree-view, users, dnd.

Constraints to respect in additions (analysis belongs to `/dm-architect`): one folder per component (lower-case, hyphenated, e.g. `date-picker/`), tokens, one changeset per release, Node 24 and Yarn 1.22.22.

## Remaining work (leads)

Non-contractual. New components that exist in neither Cunningham nor ui-kit, to be defined in `/dm-prd`; `/dm-stories` owns the real breakdown.

## Open issue mapping

> Skipped: the repository has no `origin`; the 48 open issues of `suitenumerique/ui-kit` are not this fork's backlog.

| Issue | Title | Proposed story |
| --- | --- | --- |

## Closed issues (context)

None listed (see above).
