# Revue s01-fix-button-focus-contrast / t02-focus-ring-surface-gap (livraison combinée t01+t02)

Branche vérifiée : `feature/s01-fix-button-focus-contrast/t01-focus-contrast-test`. Diff `next...HEAD` : 4 commits (test t01, rapport, correctif t01 92247df4, t02 27d24abc).

## Exécuté par le relecteur
- `yarn test` : 33 fichiers, 534 tests verts. Aucun fichier en échec (le « troisième fichier en échec » signalé plus tôt ne se reproduit pas).
- `yarn lint` OK ; `yarn check-locales` OK ; `yarn build` OK.
- `yarn test` et `yarn build` régénèrent `src/cunningham-tokens-sass.scss` (suivi) : restauré par `git checkout` à chaque fois ; absent du diff. Aucun fichier `src/cunningham-tokens*` dans `git diff next...HEAD`.

## Plan, tâche par tâche
- t01 : spec présent, 6 thèmes x 6 couleurs lus dans le CSS livré, échec explicite si jeton absent ou non hex, test de la source SCSS (4 ombres, aucun hex dans les blocs `focus-visible`). Conforme.
- t02 : diff de `button/_base.scss` = exactement 4 lignes (`#fff` vers `var(--c--contextuals--background--surface--primary)`), rien d'autre. Changeset patch correct. Tâches 1, 2, 4, 6 cochées à raison.
- Tâche 3 (Storybook clavier + a11y) non faite et non cochée : voir limites. Tâche 5 (artefact) faite côté artefact (version 1791547976-a82b) mais non cochée ; le relecteur ne peut pas la lire.

## Tests (mutations, restaurées, `git diff --exit-code` propre)
1. Un `var(surface)` remplacé par `#fff` dans `_base.scss` : 1 rouge sur 37.
2. Ring `brand` de `dsfr-dark` forcé à `#444444` dans `cunningham-tokens.css` : 1 rouge sur 37.
Les deux invariants (source SCSS, couleurs livrées par thème) mordent. Formule de luminance relue, non mutée.

## Qualité
Sécurité : sans objet. Factorisation : un jeton existant réutilisé, aucun hex restant. Design system : aucun nouveau jeton. Aucune dépendance. Pas de dérive hors plan.

## Constats
| # | Sévérité | Constat |
|---|---|---|
| 1 | minor | Tâche 3 du plan (contrôle Storybook clavier/a11y) non exécutée, faute de navigateur. Changement purement de jeton ; valeur identique en thème clair par défaut si surface = blanc, à confirmer visuellement. |
| 2 | minor | DoD : la description de PR doit porter `Artifact: updated (version 1791547976-a82b)` ; elle n'existe pas encore et la tâche 5 n'est pas cochée. À faire avant ouverture de PR (`/dm-ship`). |
| 3 | minor | `src/cunningham-tokens.js` suivi et périmé (deux thèmes), non gardé ; trailer d'un ancien commit nomme Opus 5.5. Cosmétique. |

## Non vérifié et gestes humains
- Rendu réel de l'anneau en navigateur (clair/sombre, DSFR, ANCT, 4 variantes) et panneau a11y Storybook : lancer `PORT=$(bash .dm/lib/dm-port.sh) yarn storybook`, tabuler sur chaque variante de Button dans un thème sombre et clair, vérifier l'espace visible entre bouton et anneau, puis cocher la tâche 3.
- Le contenu de la page d'artefact : jamais ouvert par le relecteur.
- Le contraste est calculé sur les jetons, pas sur des pixels rendus (états survol/actif non couverts).

Max severity: minor
Ship allowed: yes
