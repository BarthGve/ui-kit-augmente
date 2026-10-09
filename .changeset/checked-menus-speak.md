---
"@gouvfr-lasuite/ui-components": patch
---

♿️(dropdown-menu) announce the selected state and full item names: options with `isChecked`, or with a `value` when `selectedValues` is passed, are exposed as `menuitemcheckbox` with `aria-checked` (tests that query them as `menuitem` must use `menuitemcheckbox`); the item name now includes its `subText`; menu icons (leading, check, chevron) are hidden from assistive technology
