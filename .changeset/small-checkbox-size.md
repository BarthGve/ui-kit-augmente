---
"@gouvfr-lasuite/ui-components": minor
---

✨(Checkbox) add small size

`Checkbox` accepts `size?: "medium" | "small"` (default `"medium"`, unchanged
rendering). Type change: `CheckboxProps` no longer inherits the numeric HTML
`size` attribute of `<input>`; code passing `size={n}` no longer compiles (the
value was meaningless on a checkbox) and must drop it.
