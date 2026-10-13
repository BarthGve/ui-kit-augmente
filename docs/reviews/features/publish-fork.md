# Feature review — publish-fork (s56, s57)

Fresh-context review by the `stories-reviewer` subagent, two passes.

## Pass 1 — Max severity: major
- M1 (major): s57 could go live before the package exists on npm (the alias command would return 404). Fixed: merge order and stop rule written in s57 Dependencies.
- M2 (major): the dry-run archive s57 installs was undefined. Fixed: the s56 script prints the archive path and the pull-request workflow uploads it as an artifact.
- m1–m8 (minor): version origin and tag (`fork@<version>`, ancestor of `main`), `latest` dist-tag criterion, no secret on the pull-request dry-run, `docs/RELEASING.md` describes upstream (pointer added), shared component rules exempted, README install line, PRD success-criterion wording, migration pages checked not edited. All fixed.

## Pass 2 — Max severity: minor
Both majors and m1–m8 verified fixed. Remaining minors, all applied after the review:
- n1: `docs/architecture.md` and `AGENTS.md` still list `baseBranch: "main"` as a trap — added to s56 criteria.
- n2: tag/version check was tautological — reworded (version extracted from the tag, accepted by the script).
- n3: tag branch of the workflow cannot be exercised before the first publish — added to the owner's checklist in s56 notes.
- n4: no check after publication — manual check added to s57.
- n5: workflow artifact expires after 90 days — regeneration noted in s57.

Max severity: minor
Stories ready: yes
