---
"@gouvfr-lasuite/ui-components": minor
---

♿️(dropdown-menu) announce the selected state and full item names: options with `isChecked`, or with `value` when `selectedValues` is passed, are exposed as `menuitemcheckbox` with `aria-checked` (consumer tests that query them as `menuitem` must use `menuitemcheckbox`); an item's name now includes its `subText`; menu icons (leading, check, chevron) are hidden from assistive technology
