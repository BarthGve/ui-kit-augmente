# Review: s01-fix-button-focus-contrast / t01-focus-contrast-test

Revue à contexte neuf. Les tests et le lint ont été lancés par le relecteur ; l'arbre de travail est propre après les mutations (`git diff --exit-code` passe). Livraison bloquée par un constat majeur : la couverture du test pour les quatre thèmes DSFR et ANCT est fausse.

**Diff :** le commit `162a71d7` ajoute `packages/ui-components/src/components/button/focus-ring.spec.tsx` (nouveau, 91 lignes) et coche les tâches t01 du plan.

## Vérification des affirmations de l'auteur

| Affirmation | Résultat |
|---|---|
| Spec : 36 verts, 1 rouge | **Vrai.** 36 passent et 1 échoue : « paints the inner gap with the surface token », sur `0 0 0 1px #fff`. |
| Suite complète | 3 fichiers en échec, 30 passent. 523 tests verts, 1 rouge (le test voulu). |
| Deux fichiers sans lien échouent au chargement | **Vrai.** `themes-compatibility.test.ts` et `header-banner/index.spec.tsx` échouent avec « Failed to resolve entry for package @gouvfr-lasuite/ui-tokens » (pas de `dist`). Problème d'environnement, pas causé par ce diff. |
| Troisième fichier en échec | **Omis par l'auteur.** Non identifié par le relecteur ; probablement la même cause (`cunningham.ts` à la racine importe `ui-tokens`). Son erreur n'a pas été lue. |
| Lint | `eslint` sur le spec : « No issues found ». Le `yarn lint` complet n'a pas été lancé. |

## Les cinq points jugés

### 1. Le test volontairement rouge rend-il t01 inlivrable seul ?
**Oui.** La Definition of Done exige des tests verts, et le plan le répète. Livré seul, t01 rend `next` rouge et casse tous les tickets suivants. La tâche 4 demandait d'enregistrer le rouge, pas de le livrer : c'est une étape TDD, pas un état pour `next`.
- **Recommandation :** ne pas livrer t01 seul. Fusionner t01 et t02 dans une seule PR, avec deux commits si besoin (AGENTS.md autorise un second commit pour ce qui se défait seul). Le rouge est conservé comme preuve dans la description de la PR ou les notes de t01.
- **Alternatives rejetées :** `it.fails` s'inverserait en rouge quand t02 arrive (une troisième édition) ; `it.skip` ou `todo` masqueraient la garde.

### 2. Les `contextuals` DSFR et ANCT viennent de la palette par défaut
**Vérifié.** Dans `src/cunningham-tokens.ts`, les `contextuals` de `dsfr-light` et `anct-light` sont égaux à ceux de `default`. Le token testé pour `dsfr-light` est donc `#5E5CD0` (brand-550 par défaut). Le CSS livré (`.cunningham-theme--dsfr-light`, vers la ligne 1585) définit `--c--contextuals--border--semantic--brand--primary: var(--c--globals--colors--brand-550)`, et dans ce thème brand-550 vaut `#3E5DE7`. La surface suit le même schéma.
Donc 24 des 36 tests (4 thèmes × 6 couleurs) comparent des valeurs qui ne sont pas celles livrées. **Constat majeur :** fausse assurance sur le critère central (« dans chacun des six thèmes »), non signalée dans le spec.
- **Correctif préféré :** résoudre chaque `var(--c--globals--colors--X)` avec les `globals` du thème, depuis le CSS ou depuis `globals.colors`.
- **Alternative :** dire explicitement dans le spec que seules 12 combinaisons sont réelles, et ajouter un ticket pour les autres.

### 3. Chemin d'import `:/cunningham-tokens.ts`
**Vérifié et acceptable.** `src/cunningham-tokens.js` est suivi par git et périmé (autre palette). Le chemin nu du plan aurait chargé le mauvais fichier ; le commentaire du spec l'explique. **Mineur :** le `.js` périmé est un piège pour le prochain auteur. À signaler au propriétaire du dépôt, sans le corriger ici (le plan interdit d'éditer `src/cunningham-tokens.*`).

### 4. Passes vacantes et formule WCAG
- **Formule :** correcte (seuil 0,04045, branche `((c+0,055)/1,055)^2,4`, coefficients 0,2126, 0,7152, 0,0722, `(hi+0,05)/(lo+0,05)`).
- **Thème ou jeton manquant :** un thème absent échoue par `TypeError` ; une couleur absente fait échouer `expect(hex).toMatch(...)` ; un jeton avec alpha est rejeté. Aucune omission silencieuse.
- **Garde `toHaveLength(4)` :** saine contre la vacuité. **Mineur :** `focusVisibleBlocks` ne compte un `&:focus-visible` imbriqué que s'il forme un bloc ; l'assertion de longueur 4 le fige aujourd'hui.

### 5. Conventions
Nom et emplacement conformes au plan ; aucune dépendance ajoutée ; lint propre sur le nouveau fichier ; message de commit au style gitmoji + portée ; tâches du plan cochées honnêtement. Le trailer du commit nomme `Claude Opus 5.5` alors que la consigne en vigueur dit `Sonnet 5.5` (cosmétique).

## Test de mutation (restauré)
1. Seuil 3 → 8 : 37 sur 37 rouges.
2. Remplacement des quatre `0 0 0 1px #fff,` par la variable de surface (simulation de t02) : 37 sur 37 verts.
3. La formule de luminance n'a pas été mutée : un mauvais coefficient ne serait pas détecté par la suite (formule relue, pas mutée).

## Constats
| # | Sévérité | Constat |
|---|---|---|
| 1 | **major** | 24 des 36 tests de contraste (thèmes DSFR et ANCT) lisent des `contextuals` calculés avec la palette par défaut : ils ne vérifient pas les couleurs livrées dans le CSS. Fausse couverture du critère « dans chacun des six thèmes ». |
| 2 | **major** | t01 livre un test volontairement rouge dans une PR isolée, ce qui contredit la DoD. Il ne peut pas être livré seul : fusion avec t02, ou PR conditionnée à t02. |
| 3 | minor | Le `src/cunningham-tokens.js` périmé reste suivi et masque l'import des tokens ; rien ne le garde. |
| 4 | minor | Le trailer du commit nomme Opus 5.5 au lieu du modèle courant. |
| 5 | minor | Le rapport de l'auteur omet un troisième fichier en échec, probablement la même cause `ui-tokens`, non vérifié. |

## Non vérifié
- Les vraies couleurs d'anneau de DSFR et ANCT : le relecteur a seulement prouvé qu'elles diffèrent de ce qui est testé. L'auteur les a recalculées depuis `cunningham-tokens.css` (minimum 3,45 pour `dark`/success, 3,48 à 3,52 pour les thèmes sombres DSFR et ANCT) ; cela reste à confirmer par un humain.
- Les anneaux rendus dans un navigateur (ticket de test seulement ; le contrôle Storybook est dans t02).
- L'erreur du troisième fichier en échec ; `yarn lint`, `yarn check-locales` et `yarn build` complets.

Max severity: major
Ship allowed: no
