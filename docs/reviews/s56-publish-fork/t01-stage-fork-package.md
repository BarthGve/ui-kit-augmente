# Review — Ticket s56-publish-fork/t01-stage-fork-package

> Fresh-context review. Diff reviewed: `git diff next...feature/s56-publish-fork/t01-stage-fork-package`

## Plan compliance
- [x] The code does what the plan specifies, nothing more (stage script, check script, test file, `fork:stage` / `fork:check` root scripts; plan checkboxes ticked)
- [x] Run interdicts respected: `packages/` untouched in the diff (source `package.json` unchanged); no dependency added; no `npm publish`, `NPM_TOKEN`, `secrets.`, `id-token`, tag or workflow anywhere in the added lines (grep on the diff); no component/token/story change.
- Deviation accepted: the archive is installed as `file:<archive>` under the upstream key instead of an `npm:` alias. This reproduces the consumer alias (the manifest keeps its fork name under the upstream key) and fully serves AC2; the plan wording itself says "-style".

## Anti-hallucination
- [x] No invented API: `parseArgs`, `cpSync`, `import.meta.resolve`, `npm pack --json --pack-destination` all exist and run.
- [x] No plausible-but-wrong value: a real pass on the built package (stage `1.3.0-fork.1`, then check) printed ok for manifest name and version, all 9 exports entries (`.`, `./icons`, `./style`, fonts, sass) resolved to existing files, and ui-tokens installed at 3.2.0.
- [x] The code matches what it claims.

## Security
- [x] No injection: `execFileSync` with an argument array, no shell; version is validated by a strict regex before any use.
- [x] No secrets, tokens or sensitive logs. Authz, IDOR and XSS are not applicable.

## Factorization
- [x] One rule, one place (version rule only in the stage script). No speculative abstraction.

## Rules compliance
- [x] AGENTS.md followed (Node stdlib only, no new dependency, no Actions). ADR 005 respected (scope `@barthgve`, `-fork.N` suffix, repository field).
- [x] Design system: not applicable.

## Tests
- [x] Run by the reviewer: `node --test scripts/fork-package.test.mjs` 12/12 green (network tests ran); `TZ=UTC yarn test` 1163/1163 green; `src/cunningham-tokens-sass.scss` restored, tree clean.
- [x] Assertions pin the AC: name/version/repository/exports/files/dependencies/peerDependencies, source bytes identical, archive listing, 5 refused versions plus missing dist with "nothing written", and three check cases.
- [x] Bite proven by neutralization (each restored, `git diff --exit-code` clean):
  - base-version check disabled in the stage script: 1 test red (`1.4.0-fork.1`).
  - exports file-existence check removed in the check script: 1 test red (broken exports).
  - ui-tokens check neutralized in the check script: 0 tests red (see findings).
- [x] No test made redundant.

## Regressions
- [x] None: only new files under `scripts/` and two script entries in the root `package.json`.

## Findings
- minor — scripts/fork-package.test.mjs — the ui-tokens assertion of `check-fork-package.mjs` (declared and installed at the declared version) is untested: neutralizing it leaves 12/12 green. Add a case whose archive lacks `dependencies` (or whose tokens version mismatches).
- minor — scripts/check-fork-package.mjs — `import.meta.resolve` only exercises the `import` condition, so `require` and `types` targets of the root export are not checked on disk. Acceptable for V1, but the AC wording ("every exports entry") is only partly covered.
- minor — scripts/fork-package.test.mjs is not part of `yarn test`, and `scripts/` is not linted. Known gap, acceptable for this ticket; t02 or a follow-up should wire it in.
- minor — the check never imports a component (known gap): a runtime-broken bundle with correct paths would pass.

## Not verified
- No real `npm publish`, no registry-side behaviour of the `@barthgve` scope (existence, permissions), no GitHub Actions run (t02 and the owner).
- No import of a component from the installed package in a real consuming app. Gesture: in a consumer, alias `@gouvfr-lasuite/ui-components` to the packed archive and render a `Button`.
- `yarn lint` and `yarn build` were not re-run; `yarn test` only. The existing `dist/` was used for my real pass.
- Offline behaviour of the skip branch was not exercised.

## Verdict
Max severity: minor
Ship allowed: yes
