# Review — s10-card / t01-card-static

Branch verified: `feature/s10-card/t01-card-static`. Diff: `git diff next...HEAD` (16 files).

## Commandes lancées par le reviewer
- `yarn lint` : vert. `yarn check-locales` : alignées.
- `yarn test` : 36 fichiers, 564 tests verts (Card.spec : 5/5).
- `yarn build` : vert.
- `yarn test` et le build réécrivent `cunningham-tokens-sass.scss` (+24/-12 de dérive sans rapport). Restauré par `git checkout`, arbre propre ensuite.

## Fichiers générés (point 1)
- `cunningham-tokens.css` : 72 lignes ajoutées, 0 supprimée, toutes Card (12 variables x 6 thèmes).
- `cunningham-tokens.scss` : 84 ajoutées, 0 supprimée, uniquement des blocs `card`.
- `cunningham-tokens.ts` : une ligne. En retirant les 6 objets `"card":{...}`, le fichier est identique à `next` (vérifié par script).
- `cunningham-tokens-sass.scss` : 84 ajoutées, 0 supprimée, uniquement Card. Le fichier était déjà désynchronisé de `.scss` sur `next` (54 lignes de diff entre les deux), donc l'affirmation de l'implémenteur est exacte.
- Jugement : l'édition manuelle de `cunningham-tokens-sass.scss` contredit la lettre d'AGENTS.md (ne jamais éditer `src/cunningham-tokens.*`). Mais le résultat est strictement identique à la sortie du générateur, restreinte aux blocs Card. Un commit de la dérive complète mélangerait des changements sans rapport dans un ticket de composant. Sévérité : **minor**.
- À savoir pour le propriétaire : `cunningham-tokens-sass.scss` est périmé sur `next` ; chaque `yarn test` ou build le salit. Un ticket de resynchronisation dédié est à prévoir.

## Plan, tâche par tâche
Les tâches 1 à 8 sont faites, y compris les cases cochées dans le plan. La partie artefact est laissée à l'agent principal, comme le plan le prévoit. Aucune dérive : pas d'élément interactif (réservé à t02).

## Références (point 3)
- Les 12 tokens de `tokens.ts` correspondent au tableau du design.
- Les références `DefaultTokens` (`contextuals.background.surface.secondary`, `...semantic.neutral.tertiary`, `content.semantic.neutral.primary`, `border.surface.primary`, `globals.spacings.base`, `globals.font.weights.bold`, `border.semantic.brand.primary`) sont acceptées par `tsc` (lint et build verts) et résolues dans le CSS généré.
- Les littéraux sont exactement ceux déclarés comme manques du design system : 1px, 8px, ombre Calendar, 2px, 2px.

## Qualité de `index.scss` (point 4)
- BEM `c__card`, valeurs uniquement via `var(--c--components--card--*)`, `min-width: 0` et `overflow-wrap: anywhere`.
- Rien d'interactif, pas de littéral.
- Les variables `background-color--hover` et `focus-ring-*` sont déclarées mais pas encore lues : attendu, elles servent à t02.

## Tests : mutations (point 2)
Le fichier compte 5 tests. Aucun n'est décoratif. Les assertions de classes BEM sont celles que le plan demande, et les tests de structure et de rôle protègent le contrat du design.

| Mutation | Tests rouges |
|---|---|
| `padding: 16px` en dur dans `index.scss` | 1 (test de l'AC3 sur le stylesheet) |
| Wrapper de header toujours rendu | 1 |
| `role="group"` ajouté à la racine | 1 |
| Footer placé avant le body | 1 |
| Clé `extra` ajoutée à `tokens.ts` sans `build-theme` | 1 |
| Clé `focus-ring-offset` retirée de `tokens.ts` | **0** |

Tout a été restauré, `git diff --exit-code` est propre.

Le test de tokens itère sur les clés de `tokens.ts`. Il détecte donc une clé ajoutée sans régénération, mais pas une clé supprimée, car la liste attendue rétrécit avec elle. Ce n'est pas bloquant : `build-theme` est la source de vérité et la suppression d'une clé reste visible dans le diff du CSS généré. Minor.

## Stories et exports (point 5)
- Stories : `Default`, `HeaderBodyFooter` (compose Badge et Button existants) et `LongContent` (largeur contrainte).
- `Card` et `export type { CardProps }` sont exportés dans `src/index.ts` ; `@use "./components/card"` est présent dans `library.scss`.
- Aucune dépendance ajoutée.

## Changeset (point 7)
Un seul changeset, `minor`, ligne gitmoji `✨(card) add Card container`. Conforme.

## Artefact design system (point 6)
Non vérifié : je ne peux pas ouvrir l'artefact. La version `1791560502-95db` (page Card, entrée du catalogue Composants, index canvas) est à confirmer par un humain. La ligne `Artifact: updated (version 1791560502-95db)` doit figurer dans la description de la PR.

## Storybook et axe (point 8)
Non relancé par moi : seul le compte rendu de l'implémenteur (9 passes Playwright, 0 violation, thèmes default, dark et dsfr-light) existe. Je n'ai pas pu le reproduire.

## Ce que je n'ai pas pu vérifier
- Rendu visuel réel des trois stories dans les trois thèmes. Geste humain : ouvrir Storybook, passer chaque story dans les thèmes default, dark, dsfr-light et DSFR/ANCT, et lancer l'onglet Accessibilité.
- L'artefact publié. Geste humain : ouvrir la version annoncée et vérifier la page Card.
- Les quatre thèmes restants (dsfr-dark, anct-light, anct-dark) : tokens présents dans le CSS, rendu non regardé.

## Constats
- minor : édition manuelle de `cunningham-tokens-sass.scss` (justifiée, voir plus haut).
- minor : le test de tokens ne détecte pas une clé supprimée.

Max severity: minor
Ship allowed: yes
