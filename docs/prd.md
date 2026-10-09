# PRD — ui-kit fork: new components and upgrades

## Mode
brownfield

## Target SaaS
n/a — existing product (fork of <https://github.com/suitenumerique/ui-kit>, see docs/onboarding.md)

## Kill mode
n/a

## Why kill it
n/a — brownfield. Why this phase: ui-kit, the canonical La Suite numérique design system (which absorbed Cunningham), lacks components and upgrades that its own issue tracker already lists with an approved design, and has no timeline or Gantt component.

## Problem
The teams of La Suite applications compose their screens from shared components. Several components are missing (toolbar, selector, stepper, generic gauge, move modal, contact import, upload module, timeline, Gantt, and common building blocks), several existing ones need approved upgrades, and known bugs and accessibility defects remain. This fork adds and fixes them while respecting every constraint of the existing product, so that the work can be proposed upstream.

## Target users
Development and design teams of La Suite numérique applications (Docs, Drive, Meet, etc.), who install `@gouvfr-lasuite/ui-components` and `@gouvfr-lasuite/ui-tokens`, theme through tokens and compose screens from shared components.

## Perimeter — the 20% that matters
### Replicated (core loop) / In scope
The shipped baseline (docs/onboarding.md) is in scope by definition. To build:

| Feature | Complexity (1-5) | Why this score |
|---|---|---|
| Toolbar (ui-kit #217) | 2 | Action bar, button composition, keyboard navigation |
| Selector (#232) | 2 | Segmented selector, a few states |
| Stepper inside the modal (#188) | 3 | Several states and steps, Modal integration |
| Generic Gauge (#220) | 2 | `storage-gauge` exists, to generalise (design check pending) |
| Move modal (#198) | 3 | Tree navigation, depends on tree-view |
| Contact import via table (#187) | 4 | File import, table, validation (depends on DataGrid) |
| Upload module (#186) | 4 | File and progress handling, integration with `upload` |
| Accordion | 2 | Collapsible panels, keyboard accessibility |
| Breadcrumb | 2 | Link list with truncation |
| Combobox | 4 | Input plus list, ARIA, search (close to Select) |
| Skeleton | 1 | Loading placeholders |
| Card | 1 | Container with header and footer |
| Timeline | 3 | Ordered event list, several states, vertical or horizontal |
| Gantt (editable from v1) | 5 | Time axis, zoom, draggable and resizable bars, dependencies; the riskiest item |
| Bug and accessibility fixes (#184, #183, #213, #309…) | 2 | Targeted fixes; #213 (tree DND broken) is a 3 |
| Small checkbox, radio, switch (#244, #269, #245) | 1 | New size of an existing component, via tokens |
| New horizontal tabs (#231) | 2 | Visual variant, must stay backward compatible |
| Filters update (#259) | 3 | Several states and filtering logic |
| Share update (#203) | 3 | Modal with invitations and access, already complex |
| Waffle and user menu update (#278, #241) | 2 | Visual update, plus label translations |
| Alert modal (owner request, 2026-10-09) | 2 | Modal with `alertdialog` semantics and `Alert` severities, built on `Modal` |

Scale: 1 trivial CRUD · 2 form + persistence + list · 3 business logic / several states · 4 integrations, payments, roles · 5 real-time, migrations, external systems. A 5 is a graveyard candidate — keep it only if it IS the core value.

Kept despite the scale: Gantt (5) and the three 4s (Contact import, Upload module, Combobox), by explicit decision. Gantt editable from v1 is the riskiest choice: plan a read-only delivery before editing.

### Explicitly NOT replicated (graveyard) / Out of scope
- Redesign or migration of the tokens, of the token engine, and of `ui-codemod`
- Demo application or documentation site outside the existing Storybook
- Application-specific integrations (Docs, Drive, Meet), back end and real data
- New themes or a new visual identity
- Data-visualisation components other than Timeline and Gantt (charts, maps)

### The angle (done differently / better)
Strict respect of the existing product's constraints (tokens, RGAA accessibility, dark theme, i18n, Storybook and tests for every component), and components designed to be proposed upstream to ui-kit and acceptable to its maintainers.

## Constraints
- Node 24 and Yarn 1.22.22.
- One folder per component (lower-case, hyphenated, e.g. `date-picker/`); styling through tokens only (no hard-coded values); one changeset per release.
- Every new component ships with its Storybook stories, its tests and its translations (i18n).
- Detailed conventions are owned by `/dm-architect`.

## Success criteria
- Each in-scope component is published in `@gouvfr-lasuite/ui-components` with its story and tests.
- Zero violations on automated accessibility tests, full keyboard navigation, compliant contrasts.
- The ui-kit issues named in the perimeter are closed: #184, #183, #213, #309, #244, #269, #245, #231, #259, #203, #278, #241, #217, #232, #188, #220, #198, #187, #186.
- The Gantt is usable in editing mode (move, resize, dependencies) on a demonstration data set.

## Amendements

### 2026-10-09 — v0.1.0 — design-system-artifact
**Entre dans le périmètre :** each ticket that delivers or changes a component also updates the design-system artifact (https://claude.ai/artifact/XF7u4R6KevkT1uErAcxGfP): the component's page, its catalogue entry and the canvas index. Checked by hand through a line in the ticket's PR description, verified by `/dm-review`.
**Sorti du cimetière ?** oui — the graveyard item "Documentation site outside the existing Storybook" stays excluded for any documentation aimed at the users of the components (Storybook remains the only official documentation). The artifact is a deliberate exception: a private, internal design-review reference kept by the fork owner, used as a visual reference during development. It is neither published nor shipped with the packages. What changed since the exclusion: the owner asked for this reference to follow every delivery.
**Stories :** s01 to s25 (shared rule, see the shared text of docs/stories.md); s15 as soon as its design check is confirmed.

### 2026-10-09 — v0.1.0 — alert-modal
**Entre dans le périmètre :** an alert modal (story s26-alert-modal), requested by the owner: a modal exposing `role="alertdialog"` with the four `Alert` severities, built on the existing `Modal`.
**Sorti du cimetière ?** non — the graveyard is unchanged.
**Stories :** s26.

