# User Stories — ui-kit-augmente

> One story = one shippable slice, written to be executed by an agent.
> Id format: `s<number>-<short-slug>` — reused in every pipeline file and in the branch name.

**Shared by every story** (not repeated below): the work lives in `packages/ui-components/src/components/<component>/` (lower-case, hyphenated folder), styling goes through tokens (`tokens.ts` where the component has one, `index.scss` otherwise, no hard-coded values), every visible text is translatable, the component has a Storybook story and tests, passes the automated accessibility check and full keyboard navigation, and ships with one changeset in `.changeset/`. Each story that adds or changes a component also updates the design-system artifact (https://claude.ai/artifact/XF7u4R6KevkT1uErAcxGfP): the component's page, its catalogue entry and the canvas index. This is a deliberate exception to the PRD's graveyard item "documentation site outside the existing Storybook", recorded in the PRD's `## Amendements` (2026-10-09, design-system-artifact): the artifact is a private design-review reference kept by the fork owner, never published or shipped with the packages, and Storybook remains the only official documentation of the components. Issue numbers (`ui-kit #…`) refer to `suitenumerique/ui-kit`, which is not this fork's backlog (one exception, flagged where it occurs: s19 cites a Cunningham issue); they are cross-references to the approved design. Detailed conventions are owned by `/dm-architect`.

Stories are ordered by dependency: fixes first, then variants of existing components, then new components, then the Gantt in three slices.

## Story s01-fix-button-focus-contrast — Readable focus ring on the primary brand button
**As a** keyboard user of a La Suite application **I want** a visible focus ring on the primary brand button **so that** I can see where I am.

### Complexity
1

### Acceptance criteria
- [ ] The focus ring of the primary brand `Button` has a contrast ratio of at least 3:1 against the button and against the page background, in light and dark themes (checked by a test on the computed tokens).
- [ ] The other `Button` variants and sizes keep their current focus appearance (existing tests still pass).
- [ ] The accessibility check reports no new violation on the `Button` stories.

### Dependencies
None.

### Agentic notes
ui-kit #184. Files: `components/button/` (`tokens.ts`, `index.scss`). The fix goes through a token, not a hard-coded colour.

## Story s02-fix-dropdown-menu — Accessible dropdown menu that copes with long text
**As a** keyboard and screen-reader user **I want** the dropdown menu to be fully operable and to handle long labels **so that** I can use it in every application.

### Complexity
2

### Acceptance criteria
- [ ] Every item of `DropdownMenu` is reachable and activatable with the keyboard (arrows, Enter, Escape) and exposes the correct roles and states (checked by tests and the accessibility check).
- [ ] An option whose label is longer than the menu width is truncated or wrapped without overflowing the menu or hiding adjacent options.
- [ ] Selected options are announced to assistive technology.

### Dependencies
None.

### Agentic notes
ui-kit #183 (accessibility) and #309 (long text). Files: `components/dropdown-menu/`. `ContextMenu` and `HelpMenu` reuse it: run their stories and tests too.

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
- [ ] The placeholder is hidden from assistive technology (`aria-hidden="true"`) and does not take focus; the loading container that wraps it is the one marked busy by the caller.

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
Blocked until the design check of ui-kit #220 is confirmed with the user (no planning before).

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
ui-kit #188 (design approved). Files: `components/modal/` (`ModalDefaultLayout.tsx`, `ModalTabLayout.tsx`, `tokens.ts`). `OnboardingModal` already has steps: check whether `OnboardingStepItem` can be reused. Known padding bug on modals (ui-kit #286) is out of scope.

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
Risk: ARIA behaviour and screen-reader differences, and overlap with `Select` (which is already `searchable`). Decide at research time whether to extend `Select` or add a separate component. An asynchronous `Select` (Cunningham issue #286, a different tracker from ui-kit) was in progress upstream: check before duplicating. No approved design.

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
s20-upload-module.

### Agentic notes
Risk: validation rules and large files. ui-kit #187 (design approved). Depends on s20 because the file choice and the file list of the contact import reuse the upload module; the table itself comes from the existing `DataGrid`. The import reads a local file and sends nothing, so if research shows the upload module cannot be reused, drop the dependency on s20 and say so. Reuse `DataGrid` (`SimpleDataGrid`); known accessibility issue on table cells and headers upstream (RGAA 5.7): do not repeat it. Parsing is limited to the file formats chosen at research time.

## Story s22-gantt-read-only — Gantt chart, read-only
**As a** project manager **I want** to see tasks on a time axis **so that** I read the schedule at a glance.

### Complexity
3

### Acceptance criteria
- [ ] `Gantt` renders one row per task, with a bar positioned and sized from its start and end dates.
- [ ] The time axis can be zoomed between day, week and month, and the chart scrolls horizontally with a fixed task list.
- [ ] Today is marked, and a task with no dates is shown without a bar.
- [ ] Each bar exposes its task name and dates to assistive technology, and the chart is navigable by keyboard.

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
- [ ] The same changes are possible from the keyboard.
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
