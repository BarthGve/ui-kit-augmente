---
"@gouvfr-lasuite/ui-components": minor
---

✨(Switch) add small size

`Switch` accepts `size?: "medium" | "small"` (default `"medium"`, unchanged
rendering). The small size reads the new `forms-switch` `small-rail-width`,
`small-rail-height`, `small-handle-size` and `small-handle-offset` tokens and
the shared Checkbox `small-font-size`; both `labelSide` values keep working.
Type change: `SwitchProps` no longer inherits the numeric HTML `size` attribute
of `<input>`; code passing `size={n}` no longer compiles (the value was
meaningless on a switch) and must drop it.
