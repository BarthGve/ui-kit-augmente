---
"@gouvfr-lasuite/ui-components": patch
---

🐛(tree-view) call `rowProps.onClick` when an ordinary row is clicked (it was only called on title, separator and "view more" rows). It runs once per click, before the node is selected or toggled; a handler passed through `rowProps.onClick` that was silently ignored on ordinary rows now fires, including on Enter/Space, which click the row.
