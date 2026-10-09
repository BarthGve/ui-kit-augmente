# ADR 001 — Fork suitenumerique/ui-kit rather than Cunningham

- Status: accepted
- Date: 2026-10-09
- Scope: framing

## Context
The project started as a fork of Cunningham (the La Suite numérique design system). Reading the sources showed that Cunningham is being merged into `suitenumerique/ui-kit`, described as the canonical home of the design system: its README says the Cunningham sources are a history-free snapshot of react 4.3.1, and the repository was updated the day before the decision. Forking Cunningham would mean porting components that already exist in ui-kit and diverging from the line the La Suite applications consume.

## Decision
The code base is a fork of `suitenumerique/ui-kit` (remote `upstream`). The Cunningham history is kept for reference on local branch `cunningham-main` and remote `cunningham`, and is not a base for development.

## Considered options
- Fork Cunningham and port the missing ui-kit components — rejected because it duplicates work already done in ui-kit and diverges from the canonical line.
- Fork ui-kit — chosen.
- Start from an empty repository — rejected because the PRD is brownfield and requires respecting the existing product's constraints.

## Consequences
Easier: new components sit next to the La Suite ones and can be proposed upstream. Harder: the fork must follow ui-kit's conventions (docs/architecture.md), and upstream changes must be merged regularly (`git fetch upstream`). To watch: issue numbers in the stories (`ui-kit #…`) belong to the upstream tracker, not to this fork.
