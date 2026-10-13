# Drag and drop works again in the tree view — `s03-fix-tree-dnd`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

Users can move a node in `TreeView` by drag and drop again, and clicks on items shown in a portal no longer trigger their ancestors.

## User flow

1. Drag a node.
2. Drop it on a valid parent.
3. The node moves, and `afterMove` is called with the new parent and index.

## Visible rules

- Dropping on a target that `canDrop` refuses leaves the tree unchanged.
- A click on a child item rendered through a portal does not trigger the click of its ancestors.
- Moves keep working after children are loaded lazily.

## Out of scope

- Changes to the public props of `TreeView`, `TreeViewItem` or `TreeProvider`.
- Replacing the drag-and-drop library.
