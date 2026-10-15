# User Stories — ui-kit-augmente

> One story = one shippable slice, written to be executed by an agent.
> Id format: `s<number>-<short-slug>` — reused in every pipeline file and in the branch name.

**Shared by every story** (not repeated below): the work lives in `packages/ui-components/src/components/<component>/` (lower-case, hyphenated folder), styling goes through tokens (`tokens.ts` where the component has one, `index.scss` otherwise, no hard-coded values), every visible text is translatable, the component has a Storybook story and tests, passes the automated accessibility check and full keyboard navigation, and ships with one changeset in `.changeset/`. Each ticket that delivers or changes a component also updates the design-system artifact (https://claude.ai/artifact/XF7u4R6KevkT1uErAcxGfP): the component's page, its catalogue entry and the canvas index. The artifact lives outside the repository, so it is checked by hand, not by a test: the ticket's PR description carries the line `Artifact: updated (version <id>)` and `/dm-review` refuses the ticket without it. This is a deliberate exception to the PRD's graveyard item "documentation site outside the existing Storybook", recorded in the PRD's `## Amendements` (2026-10-09, design-system-artifact): the artifact is a private design-review reference kept by the fork owner, never published or shipped with the packages, and Storybook remains the only official documentation of the components. Issue numbers (`ui-kit #…`) refer to `suitenumerique/ui-kit`, which is not this fork's backlog (one exception, flagged where it occurs: s19 cites a Cunningham issue); they are cross-references to the approved design. Detailed conventions are owned by `/dm-architect`.

Stories are ordered by dependency: fixes first, then variants of existing components, then new components, then the Gantt in three slices.

## Story s01-fix-button-focus-contrast — Readable focus ring on every button
**As a** keyboard user of a La Suite application **I want** a visible focus ring on every button **so that** I can see where I am.

### Complexity
2

### Acceptance criteria
- [ ] Every `Button` variant (primary, secondary, tertiary, bordered) in every colour (brand, neutral, warning, error, success, info) draws the same two-part focus ring: an inner gap painted with the surface token `contextuals.background.surface.primary` (no literal `#fff` left in `button/_base.scss`) and an outer ring in the colour's border token.
- [ ] In each of the six themes (`default`, `dark`, `dsfr-light`, `dsfr-dark`, `anct-light`, `anct-dark`) and for each of the six colours, the outer ring has a contrast ratio of at least 3:1 against the inner gap and against the page surface. A Vitest test computes it from `src/cunningham-tokens.ts`. The ring is measured against the colours adjacent to it, not against the button fill (the gap separates them).
- [ ] The widths of the gap and of the ring, the sizes, and the non-focus appearance of every variant are unchanged (existing tests still pass).
- [ ] The accessibility check reports no new violation on the `Button` stories.

### Dependencies
None.

### Agentic notes
ui-kit #184. Files: `components/button/_base.scss` (mixin `button-variant`, four `&:focus-visible` blocks), `components/button/index.spec.tsx`. The research (docs/research/s01-fix-button-focus-contrast.md) showed the premise was half false: the ring already contrasts at 5.36:1 (light) and 3.47:1 (dark) against the page; all 36 theme × colour combinations are at 3:1 or more. What was really wrong is the literal `#fff` gap (a white halo on dark surfaces) and the absence of any test. Decision taken at research: fix all variants and colours at once (same mixin, same defect) and measure the ring against its adjacent colours; the ring cannot contrast with a button of the same hue, which is why a gap exists. `ProConnectButton` is out of scope. The fix goes through the surface token, not a hard-coded colour.

## Story s02-fix-dropdown-menu — Operable and announced dropdown menu
**As a** keyboard and screen-reader user **I want** the dropdown menu to be operable and to announce its items and selection **so that** I can use it in every application.

### Complexity
3

### Acceptance criteria
- [ ] The open menu exposes `role="menu"` and is no longer wrapped in a `role="dialog"`; a test queries the roles in the rendered DOM.
- [ ] Every item is reachable with the arrow keys, activated with Enter, and Escape calls `onOpenChange(false)`; Tab leaves the menu instead of being trapped (tests).
- [ ] An item that is selected (through `selectedValues` or `isChecked`) exposes its checked state to assistive technology (for example `aria-checked` on a `menuitemradio` or `menuitemcheckbox`), and the decorative check icon is hidden from assistive technology.
- [ ] The accessible name of an item includes its `subText` when it has one (the name is no longer overridden by the label alone).
- [ ] `onSelectValue`, `callback`, `keepOpen` and `onOpenChange` keep their current behaviour for every existing consumer (`ContextMenu`, `Filter`, `HelpMenu` and the Share dropdowns still pass their stories and tests).
- [ ] A Vitest spec for `DropdownMenu` covers the five points above (none exists today).

### Dependencies
None.

### Agentic notes
ui-kit #183 (accessibility). First slice of the original s02, split after research (docs/research/s02-fix-dropdown-menu.md): long labels, the focus indicator and the trigger state moved to s25. Files: `components/dropdown-menu/DropdownMenu.tsx` (`Popover` without `isNonModal` renders a dialog in react-aria-components 1.16.0; `aria-label={getAriaLabel(option)}` overrides the content), `components/menu/MenuItemBody.tsx` (`Checkmark2` has no accessibility attributes). Trap: switching to `selectionMode` changes `onAction` into selection events; keep `onSelectValue`, `callback` and `keepOpen` working. `ContextMenu`, `Filter`, `HelpMenu` and the Share dropdowns reuse these components: run their stories and tests, and the e2e specs that query `getByRole("menuitem", { name })` and the `.c__dropdown-menu-item__check` class.

## Story s03-fix-tree-dnd — Drag and drop works again in the tree view
**As a** user organising items in a tree **I want** to move a node by drag and drop **so that** I can restructure my content.

### Complexity
3

### Acceptance criteria
- [ ] Dragging a node onto a valid parent moves it, and `afterMove` is called with the new parent and index.
- [ ] Dropping onto a forbidden target (`canDrop` returns false) leaves the tree unchanged.
- [ ] Clicking a child item rendered through a portal does not trigger the click of its ancestors.
- [ ] The moves keep working after children are lazily loaded.

### Dependencies
None.

### Agentic notes
ui-kit #213 (DND broken), related #72 (click through portals). Files: `components/tree-view/` (`TreeView.tsx`, `TreeViewItem.tsx`, `providers/TreeContext.tsx`), `components/dnd/`. Trap: the `dndRootElement` prop and the drag-and-drop library's backend. Reproduce the bug in a failing test first.

## Story s04-small-form-controls — Small checkbox, radio and switch
**As a** designer of a dense interface **I want** small variants of checkbox, radio and switch **so that** forms fit compact layouts.

### Complexity
2

### Acceptance criteria
- [ ] `Checkbox`, `Radio` and `Switch` each accept a size option, and the small size renders with the dimensions defined by tokens.
- [ ] The default size is unchanged for existing callers (no visual or API regression, existing tests pass).
- [ ] Each small control keeps its label, hint text, error and success states, and its focus ring.
- [ ] Each small control has an interactive area of at least 24×24 px (checked by a test on the rendered size) and remains operable by keyboard and pointer.

### Dependencies
None.

### Agentic notes
ui-kit #244, #269, #245 (design approved). Files: `components/forms/checkbox`, `forms/radio`, `forms/switch`. `Radio` has an empty `tokens.ts` that reuses the checkbox tokens: do not add parallel tokens. The label side prop of `Switch` must keep working.

## Story s05-horizontal-tabs — New horizontal tabs
**As a** user navigating sections of a page **I want** the new horizontal tabs **so that** navigation matches the approved design.

### Complexity
2

### Acceptance criteria
- [ ] `Tabs` offers the new horizontal appearance through the existing `variant` option, with a Storybook story and a snapshot test, without changing the current `default` and `line` variants (their snapshots are unchanged).
- [ ] Arrow keys move between tabs, and both automatic and manual activation modes work.
- [ ] The tab list does not overflow on a narrow viewport.

### Dependencies
None.

### Agentic notes
ui-kit #231 (design approved). Files: `components/tabs/` (`Tabs.tsx`, `index.scss`). Backward compatibility is the main risk: callers use `variant`, `fullWidth` and `keyboardActivation` today.

## Story s06-waffle-user-menu — Updated app switcher and user menu
**As a** user of La Suite **I want** the updated app switcher and user menu **so that** I move between applications consistently.

### Complexity
2

### Acceptance criteria
- [ ] `LaGaufreV2` and `UserMenu` each have a Storybook story per state (closed, open, with and without user) covered by a snapshot test, and every colour, spacing and radius comes from a token (no literal value in the stylesheet).
- [ ] The waffle label is translated in every supported language.
- [ ] Keyboard navigation opens, traverses and closes both menus.

### Dependencies
None.

### Agentic notes
ui-kit #278 (design approved) and #241 (waffle label translation). Files: `components/la-gaufre/`, `components/users/menu/`, `locales/`. The waffle loads a remote widget (`widgetPath`): do not break its props.

## Story s07-filters-update — Updated filters
**As a** user searching a list **I want** the updated filters **so that** I can narrow results as designed.

### Complexity
3

### Acceptance criteria
- [ ] `Filter` and `SearchFilter` each have a Storybook story per state (default, active, open, loading, empty) covered by a snapshot test, and every colour, spacing and radius comes from a token (no literal value in the stylesheet).
- [ ] Selecting an option marks the filter active, and the reset row clears it and calls `onReset`.
- [ ] `SearchFilter` shows loading and empty states, and searching does not lose the current selection.
- [ ] Both are operable by keyboard.

### Dependencies
None.

### Agentic notes
ui-kit #259 (design approved). Files: `components/filter/`, `components/search-filter/` (`UserSearchFilter.tsx`). Existing callers pass `label`, `options`, `showReset`: keep them working.

## Story s08-share-modal-update — Updated share modal
**As a** user sharing a document **I want** the updated share modal **so that** I invite people and set their access clearly.

### Complexity
3

### Acceptance criteria
- [ ] The share modal has a Storybook story per state (default, with invitations, empty, import) covered by a snapshot test, and every colour, spacing and radius comes from a token (no literal value in the stylesheet).
- [ ] The modal keeps the invitation, role selection, link copying and import actions working (existing tests pass).

### Dependencies
None.

### Agentic notes
ui-kit #203 (design approved). Files: `components/share/` (`modal/`, `access/`, `users-invitation/`, `import-modal/`). The e2e suites `share-modal` and `share-import-modal` exist: keep them green. Out of scope on purpose: hiding the invitation mode (ui-kit #151) and "ask for access" (ui-kit #313) are not in the PRD; adding them needs a PRD amendment first.

## Story s09-skeleton — Skeleton loading placeholder
**As a** developer **I want** a skeleton placeholder **so that** loading states keep the layout stable.

### Complexity
1

### Acceptance criteria
- [ ] `Skeleton` renders a placeholder of a given width and height with a shape option (line, block, circle).
- [ ] The animation stops when the user prefers reduced motion.
- [ ] The placeholder is hidden from assistive technology (`aria-hidden="true"`) and does not take focus.

### Dependencies
None.

### Agentic notes
No equivalent in ui-kit, so there is no approved design: the visual is a proposal and needs a design review. Use the existing neutral background tokens.

## Story s10-card — Card container
**As a** developer **I want** a card container **so that** I group related content consistently.

### Complexity
1

### Acceptance criteria
- [ ] `Card` renders an optional header, a body and an optional footer slot.
- [ ] A card that is interactive is operable by keyboard and has a visible focus ring.
- [ ] Padding, radius and elevation come from tokens.

### Dependencies
None.

### Agentic notes
No equivalent in ui-kit: design to be reviewed. Keep it presentational, with no data logic.

## Story s11-accordion — Accordion
**As a** user **I want** collapsible panels **so that** I read long content section by section.

### Complexity
2

### Acceptance criteria
- [ ] `Accordion` opens and closes a panel on click and on Enter or Space.
- [ ] A single-open mode and a multiple-open mode are available.
- [ ] Each trigger exposes the expanded state to assistive technology, and arrow keys move between triggers.
- [ ] The open state can be controlled or left uncontrolled.

### Dependencies
None.

### Agentic notes
No equivalent in ui-kit: design to be reviewed. Follow the WAI-ARIA accordion pattern.

## Story s12-breadcrumb — Breadcrumb
**As a** user **I want** a breadcrumb trail **so that** I know where I am and go back up.

### Complexity
2

### Acceptance criteria
- [ ] `Breadcrumb` renders the path as links, with the last item marked as the current page.
- [ ] A long path collapses its middle items behind an expandable control that is operable by keyboard.
- [ ] The component is exposed as a navigation landmark with an accessible label.

### Dependencies
None.

### Agentic notes
No equivalent in ui-kit: design to be reviewed. The separator is decorative and must be hidden from assistive technology.

## Story s13-selector — Selector
**As a** user **I want** a segmented selector **so that** I choose one option among a few at a glance.

### Complexity
2

### Acceptance criteria
- [ ] `Selector` shows its options side by side, and clicking one selects it and calls `onChange`.
- [ ] Arrow keys move the selection and the selected option is exposed to assistive technology.
- [ ] A disabled option cannot be selected.

### Dependencies
None.

### Agentic notes
ui-kit #232 (design approved). Check that it does not duplicate `Tabs` or `Radio`; if it is only a visual variant of one of them, say so at research time and fold it into s05 or s04 through a PRD amendment instead of building a new component.

## Story s14-toolbar — Toolbar
**As a** user **I want** a toolbar of actions **so that** I reach frequent commands quickly.

### Complexity
2

### Acceptance criteria
- [ ] `Toolbar` groups buttons and separators and exposes the toolbar role with an accessible label.
- [ ] Left and right arrow keys move focus between its controls, with a single tab stop for the whole toolbar.
- [ ] Controls that do not fit wrap onto a new line, without being cut off or hidden (no overflow menu in this story).

### Dependencies
None.

### Agentic notes
ui-kit #217 (design approved). Reuse `Button` and `Separator`; do not create new controls.

## Story s15-generic-gauge — Generic gauge
**As a** developer **I want** a generic gauge **so that** I show any quantity against a limit, not just storage.

### Complexity
2

### Acceptance criteria
- [ ] `Gauge` shows a value between a minimum and a maximum, with a label, and exposes it as a meter to assistive technology.
- [ ] A value outside the range is clamped and does not break the layout.
- [ ] `StorageGauge` keeps its current behaviour (existing tests pass), and uses `Gauge` for its bar.

### Dependencies
Blocked until the design check of ui-kit #220 is confirmed with the user (no planning before). While blocked, the parent Issue stays in `backlog`, `/dm-plan` must not be run on this story, and a sequential run of the stories skips s15; no other story depends on it.

### Agentic notes
ui-kit #220 (design approved, design check pending). Files: `components/storage-gauge/` (`storage-gauge-bar/`). Do not change the `StorageGauge` public props.

## Story s16-modal-stepper — Stepper inside the modal
**As a** user in a multi-step flow **I want** a stepper in the modal **so that** I see which step I am on.

### Complexity
3

### Acceptance criteria
- [ ] A `Stepper` shows the steps with their state (done, current, upcoming) and the current one is exposed to assistive technology.
- [ ] The modal can display the stepper in its header without breaking the existing layouts (default and tabs).
- [ ] Moving to the next or previous step updates the stepper and keeps focus inside the modal.

### Dependencies
None.

### Agentic notes
ui-kit #188 (design approved). Files: `components/modal/` (`ModalDefaultLayout.tsx`, `ModalTabLayout.tsx`, `tokens.ts`). `OnboardingModal` already has steps: check whether `OnboardingStepItem` can be reused. Known padding bug on modals (ui-kit issue #286, not the Cunningham #286 cited in s19) is out of scope.

## Story s17-timeline — Timeline
**As a** user **I want** a timeline of events **so that** I read what happened in order.

### Complexity
3

### Acceptance criteria
- [ ] `Timeline` renders ordered events, each with a date, a title and optional content, in vertical orientation.
- [ ] A horizontal orientation is available and scrolls on a narrow viewport.
- [ ] Each event can be in a state (done, current, upcoming), shown in more than colour.
- [ ] The events are exposed as an ordered list to assistive technology.

### Dependencies
None.

### Agentic notes
No equivalent in ui-kit: design to be reviewed. Dates are formatted with the active locale. Out of scope: any data fetching.

## Story s18-move-modal — Move modal
**As a** user **I want** a modal to choose a destination **so that** I move an item to another folder.

### Complexity
3

### Acceptance criteria
- [ ] The modal shows the destination tree, and selecting a node enables the confirm action.
- [ ] The current location and forbidden destinations (for example the item itself) cannot be chosen.
- [ ] Confirming calls `onMove` with the chosen destination, and cancelling or closing calls nothing.
- [ ] The tree loads children lazily and the modal is operable by keyboard.

### Dependencies
s03-fix-tree-dnd.

### Agentic notes
ui-kit #198 (design approved). Reuse `Modal` and `TreeView` (with `TreeProvider.onLoadChildren`); add no tree logic of its own. Depends on s03 because the modal renders the tree inside a portal and relies on lazy loading, and s03 fixes the tree's click-through-portal behaviour (ui-kit #72) in the same files; if research shows the move modal does not hit that code, drop the dependency and say so.

## Story s19-combobox — Combobox
**As a** user **I want** to type to filter and pick an option **so that** I find a value in a long list.

### Complexity
4

### Acceptance criteria
- [ ] Typing filters the options and the arrows move through them; Enter selects and Escape closes.
- [ ] The component follows the ARIA combobox pattern: the input and the list expose the right roles and active option.
- [ ] A value that is not in the list can be allowed or refused through a prop.
- [ ] Loading and empty states are shown, and an asynchronous option source is supported.
- [ ] It shares the field states (error, success, disabled) and variants of `Input` and `Select`.

### Dependencies
None.

### Agentic notes
Risk: ARIA behaviour and screen-reader differences, and overlap with `Select` (which is already `searchable`). Decide at research time whether to extend `Select` or add a separate component. An asynchronous `Select` (Cunningham issue #286, a different tracker from ui-kit; not the ui-kit #286 cited in s16) was in progress upstream: check before duplicating. No approved design.

## Story s20-upload-module — Upload module
**As a** user **I want** to upload files and follow their progress **so that** I know when each file is done.

### Complexity
4

### Acceptance criteria
- [ ] Choosing or dropping files adds them to a list, each with name, size and progress.
- [ ] Each file shows an uploading, success or error state, and an error offers a retry.
- [ ] A file that exceeds the size limit or has a refused type is rejected with a message, without starting an upload.
- [ ] A file in progress can be cancelled.
- [ ] Progress and results are announced to assistive technology.

### Dependencies
None.

### Agentic notes
Risk: file state management and asynchronous progress. ui-kit #186 (design approved). Reuse `FileUploader` (`components/form/file-uploader/`, `UploadFileItem.tsx`) and the existing `upload` e2e suite. The component does no network call itself: the caller provides the upload function. The `FileUploader` in `forms/` and in `form/` are two folders: check at research time which one is current.

## Story s21-contact-import — Contact import via a table
**As a** user **I want** to import contacts from a file and review them in a table **so that** I invite many people at once.

### Complexity
4

### Acceptance criteria
- [ ] After choosing a file, the contacts appear in a table with one row per contact.
- [ ] Rows with an invalid or duplicate e-mail address are flagged and can be fixed or removed.
- [ ] Confirming calls `onImport` with only the valid rows.
- [ ] The table is operable by keyboard and its cells are associated with their headers.

### Dependencies
None.

### Agentic notes
Risk: validation rules and large files. ui-kit #187 (design approved). No dependency on s20: the import reads a local file in the browser and sends nothing, so it does not need the upload module's progress, cancel and retry. Choose the file with the existing `FileUploader`; the table comes from the existing `DataGrid`. Reuse `DataGrid` (`SimpleDataGrid`); known accessibility issue on table cells and headers upstream (RGAA 5.7): do not repeat it. Parsing is limited to the file formats chosen at research time.

## Story s22-gantt-read-only — Gantt chart, read-only
**As a** project manager **I want** to see tasks on a time axis **so that** I read the schedule at a glance.

### Complexity
3

### Acceptance criteria
- [ ] `Gantt` renders one row per task, with a bar positioned and sized from its start and end dates.
- [ ] The time axis can be zoomed between day, week and month, and the chart scrolls horizontally with a fixed task list.
- [ ] Today is marked, and a task with no dates is shown without a bar.
- [ ] Each bar exposes its task name and dates to assistive technology, and the chart is navigable by keyboard: Tab enters the chart, Up and Down move focus between task rows, Home and End jump to the first and last task, and the focused task announces its name and dates.

### Dependencies
None.

### Agentic notes
First slice of the PRD's Gantt (complexity 5, split here). No equivalent in ui-kit: design to be produced and reviewed before planning. Risks: date and time-zone arithmetic, performance with many rows (consider virtualising). Dates are plain data supplied by the caller. Do not build editing here.

## Story s23-gantt-move-resize — Gantt chart, move and resize tasks
**As a** project manager **I want** to move and resize task bars **so that** I reschedule directly on the chart.

### Complexity
4

### Acceptance criteria
- [ ] Dragging a bar changes its start and end by the same amount, and `onTaskChange` is called with the new dates.
- [ ] Dragging a bar edge changes only that date, and a task cannot end before it starts.
- [ ] The same changes are possible from the keyboard: with a task focused, Alt+Left and Alt+Right move it by one zoom unit, Shift+Left and Shift+Right change its end date by one zoom unit, and Escape cancels a change in progress.
- [ ] Dropping or resizing snaps to the current zoom unit (day, week or month).
- [ ] Pressing Escape during a drag cancels it and restores the original dates.

### Dependencies
s22-gantt-read-only.

### Agentic notes
Risk: pointer and keyboard interaction and snapping. Reuse `components/dnd/` only if it fits; otherwise say why at research time. The component is controlled: it never mutates the caller's data.

## Story s24-gantt-dependencies — Gantt chart, dependencies between tasks
**As a** project manager **I want** to link tasks by dependencies **so that** I see and respect their order.

### Complexity
4

### Acceptance criteria
- [ ] A dependency is drawn as a link between the end of one task and the start of another.
- [ ] A dependency can be created and removed by the user, and `onDependencyChange` reports it.
- [ ] A dependency that would create a cycle is refused with a message.
- [ ] Moving a task that has a dependent task shows a conflict when the order would be broken.
- [ ] The dependencies are listed for assistive technology.
- [ ] A Storybook story loads a demonstration data set and lets the user move, resize and link its tasks, so the PRD's success criterion (usable in editing mode) can be checked by hand.

### Dependencies
s23-gantt-move-resize.

### Agentic notes
Risk: drawing the links and cycle detection. Do not move dependent tasks automatically in this slice. Last slice of the PRD's Gantt.

## Story s25-dropdown-menu-long-labels — Dropdown menu with long labels, readable focus and announced trigger
**As a** user of a La Suite application **I want** the dropdown menu to cope with long labels, to show a readable focus and to announce whether it is open **so that** I can use it in every language and with a keyboard.

### Complexity
3

### Acceptance criteria
- [ ] A Storybook story reproduces the defect of suitenumerique/docs#2618 (French share-link labels) before the fix, and shows the same labels fixed after.
- [ ] In the default variant, the menu width adapts to the longest label up to 300px, and a longer label wraps onto several lines without overflowing the menu or hiding adjacent options.
- [ ] In the `tiny` variant (fixed 16px row), a longer label is truncated with an ellipsis and its full text remains in the accessible name.
- [ ] The focused item shows a focus indicator whose colour has a contrast ratio of at least 3:1 against the menu surface, in each of the six themes (a Vitest test computes it from `src/cunningham-tokens.ts`); the focus style stays shared with `ContextMenu` and `Filter` rows and does not regress them.
- [ ] The interactive trigger of every `DropdownMenu` usage (`FeedbackForm`, `language-picker`, `FilePreview`, `HelpMenu`, `AccessRoleDropdown`, `ShareMembersActions`, `ShareLinkSettings`, `ShareMemberItem`, `ShareInvitationItem`) exposes `aria-expanded` matching its open state and `aria-haspopup="menu"` (a test per consumer).

### Dependencies
s02-fix-dropdown-menu.

### Agentic notes
ui-kit #309 (long text) and the remaining points of #183 (focus contrast 1.11:1 measured on `#F3F3F4` over `#FFFFFF`; trigger `aria-expanded`). Second slice of the original s02. Files: `components/dropdown-menu/index.scss` (label has `flex: 1` and no `min-width: 0` or wrapping; `.c__dropdown-menu--tiny` fixes `height: 16px`; `[data-focused]` background at lines ~104-108), `DropdownMenu.tsx` (the trigger wrapper `div.c__dropdown-menu-trigger` is not the interactive element) and the nine consumer files above. Risk: the trigger lives in the callers, so the change touches nine files; decide at planning whether `DropdownMenu` can inject the attributes into its child or whether each caller is edited. Docs#2618 labels are plain words and should already wrap, so reproduce before fixing: the real defect may be a width problem in the share consumer.

## Story s26-alert-modal — Alert modal
**As a** user of a La Suite application **I want** an alert modal that interrupts me with an important message and asks me to acknowledge or decide **so that** I do not miss a critical warning, error or confirmation.

### Complexity
2

### Acceptance criteria
- [ ] `AlertModal` opens as a modal dialog exposing `role="alertdialog"`, named by its title and described by its message (`aria-labelledby`, `aria-describedby`), so assistive technology announces it on open (test on the rendered DOM).
- [ ] It supports the four severities of `Alert` (`info`, `success`, `warning`, `error`), each with its icon and semantic colour read from tokens, no literal colour.
- [ ] Focus moves into the modal on open (to the primary action, or to the dismiss action when there is none), is trapped while open, and returns to the element that opened it on close (tests).
- [ ] Actions: at least one dismiss action; an optional primary action; Escape and the dismiss action call `onClose`; a click outside does not close it by default (an opt-in prop allows it).
- [ ] All visible text (default labels) comes from the five locale files (`yarn check-locales`); title and message are caller-provided.
- [ ] Existing `Modal`, `MessageModal`, `ConfirmationModal` and `DeleteConfirmationModal` behave as before (their specs pass unchanged).

### Dependencies
None.

### Agentic notes
Requested by the owner on 2026-10-09. Build on the existing `Modal` (`components/modal/`, size and layout variants, `ModalProvider`, pre-built `MessageModal` / `ConfirmationModal` / `DeleteConfirmationModal`) and reuse the severity icons and tokens of `Alert` (`components/alert/`): do not duplicate them. Research must check first whether an alert modal is only a new pre-built variant of `Modal` (probable: complexity 2) or needs `alertdialog` support the current `Modal` lacks (react-aria-components `AlertDialog`). No `role="alertdialog"` exists in `src/` today. Keep it presentational. Same shared rules as the other component stories: artifact update, one changeset (minor), Storybook story, tests.

## Story s27-slider — Slider
**As a** user setting a value in a range **I want** a slider **so that** I pick a number or a range without typing.

### Complexity
2

### Acceptance criteria
- [ ] `Slider` selects a single value or a range between `min` and `max` with `step`, controlled and uncontrolled (`useControllableState`).
- [ ] Arrow keys change the value by `step`, Home/End jump to the bounds, PageUp/PageDown by a larger step (tests).
- [ ] The thumb has an accessible name and exposes `aria-valuemin|max|now|valuetext`; a disabled slider cannot be changed.
- [ ] Track, thumb and focus ring come from `--c--components--slider--*` tokens, in the six themes.

### Dependencies
None.

### Agentic notes
shadcn Slider. Build on the react-aria-components `Slider`. Two-thumb range is part of this story. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s28-sheet — Sheet (side panel)
**As a** user working in a page **I want** a side panel that slides over the page **so that** I edit or read details without leaving the page.

### Complexity
3

### Acceptance criteria
- [ ] `Sheet` opens from the left, right, top or bottom as a modal dialog (`role="dialog"`, named by its title) with a backdrop.
- [ ] Focus moves in, is trapped, returns to the opener on close; Escape and the close button call `onClose`; outside click closes it unless disabled (tests).
- [ ] Header, body and footer slots; the body scrolls while header and footer stay visible.
- [ ] Width, padding and elevation come from tokens; the slide animation is removed under `prefers-reduced-motion`.

### Dependencies
None.

### Agentic notes
shadcn Sheet. Reuse the `Modal` internals (`components/modal/`, react-aria `Modal`/`Dialog`) rather than a second overlay system. Distinct from s29 (touch drawer). Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s29-drawer — Drawer (bottom sheet)
**As a** mobile user **I want** a bottom drawer I can drag closed **so that** I use overlays comfortably on touch screens.

### Complexity
3

### Acceptance criteria
- [ ] `Drawer` opens from the bottom as a modal dialog with a drag handle; a swipe or drag down beyond a threshold closes it (test with pointer events).
- [ ] Keyboard and screen reader users can close it with Escape and a labelled close button; focus is trapped and restored.
- [ ] Snap points are optional; content taller than the viewport scrolls inside the drawer.
- [ ] Radius, handle and elevation come from tokens; motion respects `prefers-reduced-motion`.

### Dependencies
s28-sheet.

### Agentic notes
shadcn Drawer (vaul-style). Share the overlay base with s28; no new dependency without an ADR (use pointer events or an existing library). Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s30-empty — Empty state
**As a** user facing a list with no content **I want** an empty state **so that** I understand why nothing is shown and what to do next.

### Complexity
1

### Acceptance criteria
- [ ] `Empty` renders an optional icon or media slot, a title, a description and an optional action area.
- [ ] It is presentational: no `role` beyond a landmark-free group; the title is a heading level chosen by the caller (`headingLevel`).
- [ ] Spacing and colours come from tokens; works in the six themes.

### Dependencies
None.

### Agentic notes
shadcn Empty. Keep it free of data logic. Likely a small component reusing `Button` for the action. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s31-input-otp — Input OTP
**As a** user entering a verification code **I want** a one-time-code input **so that** I type a code digit by digit.

### Complexity
3

### Acceptance criteria
- [ ] `InputOTP` renders `length` slots; typing fills slots and moves focus forward, Backspace moves back, paste fills all slots (tests).
- [ ] Exposes one logical field to assistive technology (`autocomplete="one-time-code"`, an accessible name, `aria-invalid` on error) and works with `Field`.
- [ ] Optional groups and a separator; `onComplete` fires once when all slots are filled.
- [ ] Slot size, border and focus ring come from tokens; error and disabled states.

### Dependencies
None.

### Agentic notes
shadcn Input OTP. Beware the form/forms split: put it under `components/forms/input-otp/`. Mobile keyboards and autofill are the risk. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s32-button-group — Button group
**As a** user choosing among related actions **I want** grouped buttons **so that** related actions read as one control.

### Complexity
1

### Acceptance criteria
- [ ] `ButtonGroup` renders adjacent `Button`s with shared borders and radius only on the outer edges, horizontal or vertical.
- [ ] Keyboard order follows DOM order; the group exposes `role="group"` with an accessible name when given.
- [ ] Works with every `Button` variant and size and with a split button (button + dropdown trigger).
- [ ] Gap and radius come from tokens.

### Dependencies
None.

### Agentic notes
shadcn Button Group. Presentational wrapper around `Button`; do not change `Button` itself. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s33-input-group — Input group
**As a** user filling a form **I want** an input with a prefix, suffix or inline action **so that** units, icons and buttons sit inside the field.

### Complexity
2

### Acceptance criteria
- [ ] `InputGroup` wraps `Input` (and `TextArea`) with leading and trailing addons: text, icon or button.
- [ ] The group shows one shared border and one focus ring; clicking an addon text focuses the input.
- [ ] Error, success and disabled states of `Field` propagate to the whole group; addons are `aria-hidden` unless interactive.
- [ ] Addon spacing and colours come from tokens.

### Dependencies
None.

### Agentic notes
shadcn Input Group. Build on `forms/input` and `Field`; mind the form/forms split. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s34-toggle — Toggle button
**As a** user switching a state on or off **I want** a toggle button **so that** a tool or format option stays pressed.

### Complexity
1

### Acceptance criteria
- [ ] `Toggle` renders a button with `aria-pressed`; click, Enter and Space switch it; controlled and uncontrolled.
- [ ] Variants `default` and `outlined`, sizes like `Button`; the pressed state is visible without colour alone.
- [ ] Focus ring and colours from tokens in the six themes.

### Dependencies
None.

### Agentic notes
shadcn Toggle (the Toggle Group is covered by s13-selector). react-aria-components `ToggleButton`. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s35-hover-card — Hover card
**As a** user scanning a page **I want** a card shown on hover or focus of a trigger **so that** I preview details without clicking.

### Complexity
2

### Acceptance criteria
- [ ] `HoverCard` opens after a delay on hover and on keyboard focus of its trigger, and closes on blur, Escape or pointer leave (tests with timers).
- [ ] The card is reachable by keyboard and not announced as a dialog; content is also available some other way (documented rule).
- [ ] Placement follows `Popover`; elevation and radius from tokens.

### Dependencies
None.

### Agentic notes
shadcn Hover Card. Relation to `Tooltip` and `Popover`: reuse their positioning. Touch devices have no hover: document the fallback. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s36-kbd — Kbd (keyboard key)
**As a** user reading help text **I want** a visual keyboard key **so that** shortcuts are shown consistently.

### Complexity
1

### Acceptance criteria
- [ ] `Kbd` renders a `kbd` element with key styling; `KbdGroup` joins several keys with a separator.
- [ ] Platform-aware helper shows ⌘ on macOS and Ctrl elsewhere, overridable; text stays readable by screen readers.
- [ ] Font, border and background from tokens.

### Dependencies
None.

### Agentic notes
shadcn Kbd. Trivial presentational component. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s37-collapsible — Collapsible
**As a** user reading a page **I want** a single collapsible region **so that** I show or hide a block of content.

### Complexity
1

### Acceptance criteria
- [ ] `Collapsible` has a trigger and a content region; the trigger exposes `aria-expanded` and `aria-controls`; Enter and Space toggle it.
- [ ] Controlled and uncontrolled; the collapsed content is not focusable and hidden from assistive technology.
- [ ] Height transition removed under `prefers-reduced-motion`.

### Dependencies
None.

### Agentic notes
shadcn Collapsible. Share the disclosure logic with s11-accordion (react-aria `Disclosure`). Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s38-carousel — Carousel
**As a** user browsing a set of items **I want** a carousel **so that** I move through slides.

### Complexity
3

### Acceptance criteria
- [ ] `Carousel` shows one or more slides with previous and next buttons and optional indicators; keyboard arrows move between slides (tests).
- [ ] The region is labelled (`aria-roledescription="carousel"`), each slide is a labelled group, and autoplay (if any) can be paused and stops on focus.
- [ ] Touch swipe and scroll-snap work; `prefers-reduced-motion` disables animation.
- [ ] Controls and indicators from tokens.

### Dependencies
None.

### Agentic notes
shadcn Carousel. Prefer native CSS scroll-snap over a new library; ADR needed otherwise. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s39-aspect-ratio — Aspect ratio
**As a** developer placing media **I want** a fixed aspect-ratio container **so that** images and videos keep their proportions.

### Complexity
1

### Acceptance criteria
- [ ] `AspectRatio` renders its child inside a box of the given `ratio` (e.g. 16/9) and the child fills it without distortion.
- [ ] The default ratio is 1; invalid ratios fall back to 1 (test).
- [ ] No extra DOM role.

### Dependencies
None.

### Agentic notes
shadcn Aspect Ratio. Use the CSS `aspect-ratio` property. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s40-menubar — Menubar
**As a** user of a desktop-style application **I want** a menubar **so that** I reach grouped commands from a persistent bar.

### Complexity
3

### Acceptance criteria
- [ ] `Menubar` renders top-level menus; arrow keys move between menus, Enter/Space/ArrowDown opens, Escape closes, hover switches menus while one is open (tests).
- [ ] Roles `menubar`, `menu`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, shortcuts shown with `Kbd`.
- [ ] Sub-menus supported; items reuse the `DropdownMenu`/`Menu` item rendering.
- [ ] Colours, spacing and elevation from tokens.

### Dependencies
s02-fix-dropdown-menu (done), s36-kbd.

### Agentic notes
shadcn Menubar. Reuse `components/menu/` item bodies and the semantics settled in ADR 003. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s41-navigation-menu — Navigation menu
**As a** user of a site with many sections **I want** a navigation menu with fly-out content **so that** I discover sections of a large site.

### Complexity
3

### Acceptance criteria
- [ ] `NavigationMenu` renders top-level links and triggers whose panels open on click or focus with keyboard arrows between items (tests).
- [ ] Uses a `nav` landmark with a label; the current page link has `aria-current="page"`; panels are not `menu` roles.
- [ ] On narrow screens it collapses to a button-opened list.
- [ ] Tokens for spacing, elevation, colours.

### Dependencies
None.

### Agentic notes
shadcn Navigation Menu. Distinct from `Menubar` (application commands). Check overlap with `layout` header before building. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s42-sidebar — Sidebar
**As a** user of an application **I want** a collapsible sidebar **so that** I navigate between areas of the app.

### Complexity
4

### Acceptance criteria
- [ ] `Sidebar` provides header, grouped navigation, footer, and a collapsed (icons only) mode toggled by a button and a keyboard shortcut.
- [ ] Landmark `nav`/`aside` with a label; current item `aria-current`; collapsed state persists through a controlled prop; tooltips on icons when collapsed.
- [ ] On narrow screens it becomes an off-canvas sheet (s28).
- [ ] Widths, colours and transitions from tokens; reduced motion respected.

### Dependencies
s28-sheet.

### Agentic notes
shadcn Sidebar. Complexity 4: provider/context, responsive behaviour, persistence. Check overlap with `layout` left panel (`components/layout/`) and reuse it. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s43-scroll-area — Scroll area
**As a** user of a constrained panel **I want** a styled scroll area **so that** scrollbars match the interface on every platform.

### Complexity
2

### Acceptance criteria
- [ ] `ScrollArea` wraps content with custom thin scrollbars (vertical and horizontal) that remain keyboard and wheel operable and keep native scroll semantics.
- [ ] The viewport is focusable when it scrolls (`tabindex=0`) and labelled; scrollbars hide when not needed.
- [ ] Scrollbar colours and sizes from tokens; forced-colors mode falls back to native.

### Dependencies
None.

### Agentic notes
shadcn Scroll Area. Compare with `smart-scroller`; prefer CSS (`scrollbar-width`, `::-webkit-scrollbar`) over JS. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s44-resizable — Resizable panels
**As a** user arranging a workspace **I want** resizable panels **so that** I adjust the space given to each area.

### Complexity
3

### Acceptance criteria
- [ ] `ResizablePanelGroup` lays out panels with draggable handles, horizontal or vertical, with `minSize`/`maxSize` per panel (pointer test).
- [ ] Handles are keyboard operable (arrows, Home/End), `role="separator"` with `aria-valuenow` and an accessible name.
- [ ] Controlled sizes and `onResize`; double click on a handle resets (optional).
- [ ] Handle visuals from tokens.

### Dependencies
None.

### Agentic notes
shadcn Resizable. A `resize-handle` folder already exists without component: check what it holds and reuse. No new dependency without ADR. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s45-item — Item
**As a** developer building lists **I want** a generic list item **so that** media, title, description and actions are laid out consistently.

### Complexity
1

### Acceptance criteria
- [ ] `Item` renders optional media, title, description and an actions area, with variants `default`, `outlined`, `muted` and sizes.
- [ ] It can render as a link or button (`href`/`onPress`) with a visible focus ring, and groups into a list with `ItemGroup`.
- [ ] Tokens for spacing and colours.

### Dependencies
s10-card.

### Agentic notes
shadcn Item. Reuse the interactive pattern of `Card` (s10). Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s46-typography — Typography
**As a** designer and developer **I want** typography components **so that** headings and text share the same scale.

### Complexity
2

### Acceptance criteria
- [ ] Components or classes for `h1`–`h4`, paragraph, lead, large, small, muted, blockquote, inline code and list read sizes and weights from tokens.
- [ ] Heading level is chosen independently of its visual style (`as` prop) and a heading never skips levels by default styling.
- [ ] Storybook shows the full scale in the six themes.

### Dependencies
None.

### Agentic notes
shadcn Typography. Design tokens for typography already exist in `ui-tokens`; do not redesign them (out of scope, PRD graveyard). Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s47-chart — Chart
**As a** user reading data **I want** simple charts **so that** I see trends and comparisons.

### Complexity
4

### Acceptance criteria
- [ ] `Chart` renders bar, line and area charts from a data array with axes, legend and tooltip, themed by tokens in the six themes.
- [ ] Every chart has a text alternative: an accessible name, a summary and a data table fallback toggle (test).
- [ ] Colour is never the only differentiator (patterns or labels) and colours meet 3:1 against the surface.
- [ ] Responsive to its container; reduced motion respected.

### Dependencies
None.

### Agentic notes
shadcn Chart (Recharts wrapper). Needs a charting library: a new dependency requires an ADR. The PRD graveyard listed data visualisation as out of scope; reopened by the owner on 2026-10-09 (see PRD amendment) — maps stay excluded. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s48-bubble — Chat bubble
**As a** user reading a conversation **I want** chat bubbles **so that** messages are visually grouped by sender.

### Complexity
2

### Acceptance criteria
- [ ] `Bubble` renders content with variants (`default`, `secondary`, `muted`, `tinted`, `outline`, `ghost`, `destructive`) and `align` start or end.
- [ ] `BubbleGroup` groups consecutive bubbles; `BubbleReactions` shows a reactions row labelled for assistive technology.
- [ ] A bubble can render as a link or button; errors are also in text, not colour only.
- [ ] Max width 80% of the container; tokens only.

### Dependencies
None.

### Agentic notes
shadcn Bubble. Part of a chat set with s49 and s50. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s49-message — Message
**As a** user reading a conversation **I want** a message row **so that** author, time and actions go with the content.

### Complexity
2

### Acceptance criteria
- [ ] `Message` lays out avatar (from `users`), author name, timestamp, content (a `Bubble`) and message actions.
- [ ] Message actions are reachable by keyboard and shown on hover and focus; the timestamp uses `<time>`.
- [ ] Own and others' messages align differently; spacing from tokens.

### Dependencies
s48-bubble.

### Agentic notes
shadcn Message. Reuse `Avatar` from `components/users`. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s50-message-scroller — Message scroller
**As a** user following a live conversation **I want** a scroll area tuned for chat **so that** new messages are followed only when I am at the bottom.

### Complexity
4

### Acceptance criteria
- [ ] `MessageScroller` follows new content only while the reader is at the live edge and shows a jump-to-latest button otherwise (test with a scrollable jsdom/Playwright harness).
- [ ] Prepending older messages keeps the scroll position.
- [ ] The viewport is a labelled focusable region and the content is `role="log"`, with `aria-busy` while streaming.
- [ ] Jump to a given message id.

### Dependencies
s49-message.

### Agentic notes
shadcn Message Scroller. Scroll anchoring is the risk: needs a real-browser test. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s51-marker — Marker
**As a** user reading a conversation or timeline **I want** inline markers **so that** system notes and dividers sit between messages.

### Complexity
1

### Acceptance criteria
- [ ] `Marker` renders variants `default`, `border` and `separator` (centred label with rules) with an optional icon and content.
- [ ] Presentational by default; `role="status"` when it reports progress; icon-only markers need an `aria-label`.
- [ ] Tokens only.

### Dependencies
None.

### Agentic notes
shadcn Marker (companion of Message). May be reused by s17-timeline. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s52-questionnaire — Questionnaire
**As a** user answering a series of questions **I want** a step-by-step questionnaire **so that** I answer one question at a time.

### Complexity
4

### Acceptance criteria
- [ ] `Questionnaire` shows one item at a time with previous, next, skip and submit; single choice, multiple choice and free text; required validation blocks next.
- [ ] Each item is a `fieldset` with a `legend`; invalid controls expose `aria-invalid`; focus moves to the new item or to the first invalid control; inactive items are inert (tests).
- [ ] Progress is a named progress bar; answers are read from `FormData` on submit; controlled navigation is supported.
- [ ] Keyboard shortcuts for choices are optional.

### Dependencies
s16-modal-stepper.

### Agentic notes
shadcn Questionnaire. Overlaps with the stepper (s16): share step state logic. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s53-direction — Direction (RTL support)
**As a** user of a right-to-left language **I want** right-to-left layouts **so that** the interface mirrors correctly.

### Complexity
3

### Acceptance criteria
- [ ] `DirectionProvider` sets `dir` for its subtree and `useDirection()` returns the value; `Provider` can take a `direction`.
- [ ] Components use logical CSS properties (inline-start/end) so a Storybook toolbar switch to RTL mirrors them; audit of the existing components lists those that do not (report, not all fixed here).
- [ ] Keyboard arrow semantics follow direction in components that use arrows (Tabs, Slider).

### Dependencies
None.

### Agentic notes
shadcn Direction. Large audit surface: scope this story to the provider, the hook, the Storybook switch and the audit report; fixes become separate stories. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s54-native-select — Native select
**As a** user on a mobile device or with a simple form **I want** a native select **so that** the platform picker is used when richer UI is not needed.

### Complexity
1

### Acceptance criteria
- [ ] `NativeSelect` wraps a native `select` with the `Field` look: label, hint, error and success states, disabled.
- [ ] Options and optgroups are passed as children or an `options` array; the value is controlled or uncontrolled.
- [ ] Tokens for border, radius and focus ring consistent with `Input`.

### Dependencies
None.

### Agentic notes
shadcn Native Select. Existing `Select` is custom; keep both. Mind the form/forms split. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s55-attachment — Attachment
**As a** user adding files to a message or form **I want** attachment chips **so that** I see, open and remove attached files.

### Complexity
2

### Acceptance criteria
- [ ] `Attachment` renders a file chip with icon or thumbnail, name, size, and an optional remove button with an accessible name including the file name.
- [ ] A list of attachments is a list (`ul`); upload progress and error states are shown and announced.
- [ ] Reuses file-type icons from `FileUploader` / `Preview`; tokens only.

### Dependencies
s20-upload-module.

### Agentic notes
shadcn Attachment. Partially covered by the upload module (s20): this story is the display component only. Added on 2026-10-09 from the comparison with shadcn/ui (owner request). Same shared rules as the other component stories: Storybook story, tests, five locales if text, one changeset (minor), artifact page and catalogue entry.

## Story s56-publish-fork — Publish the fork on npm
**As a** fork owner **I want** `ui-components` published on npm under my scope **so that** any project installs the fork with a version.

### Complexity
3

### Acceptance criteria
- [ ] A publish script `scripts/stage-fork-package.mjs` takes the version as an argument, builds a staging copy of `packages/ui-components` where only `name` (`@barthgve/ui-components`) and `version` are rewritten, and prints the path of the packed archive (`npm pack`); the source `package.json` is unchanged (`git diff` empty). It refuses a version that does not end in `-fork.<N>` or whose base part is not the current `ui-components` version.
- [ ] A check installs that archive in a throwaway project with the alias `@gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version>`, and imports a component, `./style` and `./icons` through the `exports` map; it fails if any entry does not resolve.
- [ ] The package contents are limited to `dist` (`npm pack --dry-run` lists it) and `ui-tokens` stays a regular dependency at its current version.
- [ ] `.changeset/config.json` has `baseBranch: "next"`.
- [ ] A workflow `.github/workflows/publish-fork.yml` runs on tags `fork@<version>` and on pull requests (dry-run only). On a tag it requires the tag commit to be an ancestor of `main`, the version extracted from the tag to be accepted by the script (`-fork.<N>` suffix, base version equal to the `ui-components` version), then lint, tests and build, then `npm publish --provenance` with the `NPM_TOKEN` secret and the `latest` dist-tag (`id-token: write`). On a pull request it runs the script and the install check, uploads the archive as a workflow artifact, uses no secret, and publishes nothing.
- [ ] `docs/RELEASING.md` states at its top that it describes the upstream packages, and points to ADR 005 and the workflow for the fork; the `baseBranch` trap in `docs/architecture.md` and in the technical conventions of `AGENTS.md` is updated to match the corrected value.

### Dependencies
None.

### Agentic notes
ADR 005 owns the decisions. Do not rename in the source; do not publish `ui-tokens` or `ui-codemod`. The agent never holds the npm token: the story ends with the dry-run on a pull request and the archive artifact; the first real publish (scope confirmation, `NPM_TOKEN` secret, first tag, and checking the tag branch of the workflow ran: ancestor of `main`, publish, `latest` tag) is the owner's, listed in the PR. Exempt from the shared component rules (no component, no changeset since the package source does not change, no artifact page, no locale): the check is the pack-and-install test and the workflow dry-run. A new script and a new workflow file are the only code; no dependency added (use `npm`, `node`).

## Story s57-consume-fork — Consume the fork in an application
**As a** developer of an application **I want** installation instructions for the fork **so that** I use it without changing my imports.

### Complexity
2

### Acceptance criteria
- [ ] The root `README.md`, `packages/ui-components/README.md` and the Storybook installation page no longer show the upstream install command as the way to get the fork: they explain, in this order, (1) what the fork package is (`@barthgve/ui-components`, versions `x.y.z-fork.N`, only `ui-components` is published, `ui-tokens` and `ui-codemod` stay upstream), (2) the install through the alias for Yarn and npm (`@gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version>`), flagged as available after the first publish, (3) until then the install from the archive (`yarn build`, `yarn fork:stage <version>`, then `file:` install), (4) the peer dependencies and the style/fonts imports already documented.
- [ ] The page states that `ui-tokens` and `ui-codemod` remain the upstream packages and that the built code is public on npm.
- [ ] The README package table points to the fork package and gains an install line with the alias command.
- [ ] A throwaway app (outside the repository, not committed) installs the archive produced by the s56 dry-run with the alias and renders a component with its stylesheet; the result is written in the PR. The check validates the archive, not the registry; if the workflow artifact has expired (90 days), rerun the s56 script to regenerate it. After the first real publish and before merging, the command printed on the page is run as written in a throwaway app and the result is written in the PR.

### Dependencies
s56-publish-fork. **Merge order, changed by the owner on 2026-10-13:** the owner asked for the README to explain the installation now. Until the first real npm publish the docs describe the true state (package not yet on npm; install from the archive built by `yarn fork:stage`) and give the alias command as the target form once published; they never present a command that returns a 404 as working. A follow-up one-line edit removes the "not yet published" notice after the first publish.

### Agentic notes
Docs only (`installation.mdx`, `README.md`); no code change, exempt from the shared component rules (no changeset, artifact page, locale). The other mdx pages (`customization.mdx`, `0_migrating_to_lasuite_ui.mdx`, `docs/MIGRATION.md`) print upstream import names or `npx @gouvfr-lasuite/ui-codemod` commands: they stay valid thanks to the alias and the unchanged codemod, so they are checked, not edited.

## Story s58-ci-green-basics — CI basics: build order and commit lint
**As a** fork maintainer **I want** the unit-test and commit-lint jobs of the CI to pass **so that** a red CI means a real problem.

### Complexity
2

### Acceptance criteria
- [ ] `turbo.json`: the `test` task depends on `^build`, so `@gouvfr-lasuite/ui-tokens` is built before vitest runs; on a clean checkout `yarn test` passes from the first run (no "Failed to resolve entry for package @gouvfr-lasuite/ui-tokens").
- [ ] The CI jobs `test` and `Publish fork / verify` (delivered by s56, red for the same `yarn test` reason) pass on a pull request; if `yarn lint` or `yarn build` of the same jobs fail for another cause, it is listed in the pull request and fixed here when it is not a component defect.
- [ ] The `lint-git` job accepts squash and release commits of 80+ characters per line (the squash commit of release v0.2.0 on `main` has body lines up to 103 characters and cannot be rewritten): a `.gitlint` at the repository root ignores commits whose title ends with a pull-request reference `(#<number>)` (GitHub squash commits, including `🔖(release)` ones) while keeping the length rule for every other commit; the exemption applies in both directions (the `sync/main-into-next` pull request #202 and a future `next` → `main` release pull request, which both carry squash commits); a test commit message proves both cases (exempt title with a long line passes, non-exempt title with a long line is rejected).
- [ ] `docs/architecture.md` states that the CI is active and what it runs; the "no CI on this fork" line of `AGENTS.md` (git-ignored, edited by the owner) is listed in the pull request.

### Dependencies
None.

### Agentic notes
No new dependency. Check the effect on the build time of `yarn test` (the build of `ui-components` is a dependency of its own tests only through `^build`, i.e. `ui-tokens`). The sync pull request #202 (`sync/main-into-next`, `-s ours` merge) must pass `lint-git` once the configuration is merged (re-run its checks). Exempt from the shared component rules (no component, no changeset, no artifact page, no locale).

## Story s59-cross-browser-e2e — Playwright component tests green on Firefox and WebKit
**As a** fork maintainer **I want** the component tests to pass on chromium, Firefox and WebKit **so that** the delivered components are proven in the three engines.

### Complexity
3

### Acceptance criteria
- [ ] For each of the 12 Firefox and WebKit failures of the first CI run, the cause is established (test written for chromium, or real rendering defect) and written in the pull request: Gantt (firefox: `gantt.spec.tsx` 214, 235, 610, 1530; webkit: 235, 455, 610, 1028, 1530), Timeline horizontal (`timeline.spec.tsx` 66, firefox and webkit: 24px markers, 2px connector, 192px items), Filter (webkit, `filter.spec.tsx` 49: keyboard focus ring).
- [ ] A real defect is fixed in the component, with the failing test kept; a chromium-only assumption is fixed in the test (browser-neutral assertion), never by skipping, removing or loosening it without a stated reason. Any `test.skip` or `test.fixme` is a last resort for a documented engine limitation: it names the engine, the reason and a traced follow-up (story id or issue), and the pull request lists their number.
- [ ] No accessibility regression: the focus ring, contrast and keyboard guards of s07, s17, s22 to s24 keep passing.
- [ ] The one chromium failure of `e2e/file-preview/pdf-preview-mixed-sizes.spec.tsx:159` (current page 8 instead of 11; it is not a Firefox or WebKit failure but the `e2e` job cannot pass without it) is classified: reproduced on the upstream code (`upstream/main`) or not. If upstream also fails, the test is marked with that evidence and left out of this story's fix; if not, it is fixed.
- [ ] The `e2e` job of the CI passes on a pull request (chromium, webkit, firefox).

### Dependencies
s58-ci-green-basics (ordering of priority only: the `e2e` job does not depend on the `test` job, but a green CI needs both).

### Agentic notes
The agent cannot run WebKit and Firefox locally unless `yarn playwright install webkit firefox` has been run: do it once, outside the repository. Port from `bash .dm/lib/dm-port.sh`, throwaway config, no broad `pkill`. If the investigation finds more than three distinct root causes, split this story at planning. Touches the specs of Gantt, Timeline and Filter and possibly their stylesheets; a stylesheet change must keep the computed values on chromium (the earlier measurements are the reference). Exempt from the shared component rules unless a component changes: then one changeset (patch) and the artifact page.

## Story s60-fork-release — GitHub Release for each fork publication
**As a** developer who installs the fork **I want** a GitHub Release for each published version **so that** I see what changed, find the exact version, and can install the archive without going through npm.

### Complexity
2

### Acceptance criteria
- [ ] On a tag `fork@<version>`, once the `publish` job has succeeded, a separate `release` job creates a GitHub Release named `<version>` on that tag. It is marked as a prerelease, its notes are generated from the pull requests merged since the previous `fork@` tag, which is passed explicitly (`--notes-start-tag`) so the first Release does not depend on an earlier Release, it links to `https://www.npmjs.com/package/@barthgve/ui-components/v/<version>`, and the archive checked by the `verify` job is attached.
- [ ] The `release` job is the only one with `contents: write`; `publish` keeps `contents: read` and `id-token: write`, and `release` has no `id-token`. The workflow test asserts both, and also that `release` needs `publish`, runs only on a `fork@` tag, uses `--prerelease` and generated notes, and guards against an existing Release.
- [ ] Rerunning only the `release` job (`gh run rerun --job`; a whole-run rerun would replay `publish` on an already published version) creates the Release if it is missing and does not create a second one: the job checks `gh release view` first. The npm publication does not depend on `release`: nothing in `publish` needs it.
- [ ] On pull requests (dry run) the `release` job does not run.
- [ ] The root README, the package README and the Storybook installation page state that the package is identified by `x.y.z-fork.N` (on npm and, from the first version published after this story, in the Releases); that the product version of the repository (`VERSION`, `CHANGELOG.md`) is a different number, as are the `ui-components` version and the root `package.json`; and how to install from a Release archive. No product version is written in these texts, and nothing is announced that does not exist yet: the text is merged with, or after, the workflow change.
- [ ] ADR 007 records the decisions (job separation, permission, trigger, failure handling, notes source); `docs/architecture.md` lists the job.

### Dependencies
s56 (publish workflow) and s57 (the three install texts, completed here, not replaced). Needs `/dm-architect` (ADR 007) before planning.

### Agentic notes
Files: `.github/workflows/publish-fork.yml`, `scripts/publish-fork-workflow.test.mjs`, the three install texts, `docs/architecture.md`, ADR 007. Use the `gh` CLI preinstalled on the runner with the job's `GITHUB_TOKEN`; no new action and no secret. The workflow test finds the publish job by the words `npm publish` and forbids `id-token` outside it, even in a comment: the `release` job must contain neither. Do not give `contents: write` to the `publish` job, and do not add a release step after `npm publish` in the same job. Tags are immutable: a workflow fix needs a new tag, and a tag publishes to npm, so the first end-to-end proof is the next real publication (list the unverified part in the PR). Out of scope on purpose: backfilling Releases for `fork@1.4.0-fork.1` to `.6`, GitHub Packages, product releases (`fork-v…` tags) and the wiki.
