---
"@gouvfr-lasuite/ui-components": minor
---

✨(Radio) add small size

`Radio` accepts `size?: "medium" | "small"` (default `"medium"`, unchanged
rendering). The small size reads the shared Checkbox `small-size` and
`small-font-size` tokens. Type change: `RadioProps` no longer inherits the
numeric HTML `size` attribute of `<input>`; code passing `size={n}` no longer
compiles (the value was meaningless on a radio) and must drop it.
