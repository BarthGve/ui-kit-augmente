# Revue des stories : ui-kit fork (deuxième passe)

> Revue à contexte neuf de `docs/stories.md` contre `docs/prd.md`. Lecture seule, aucun fichier modifié. Les correctifs du premier rapport (commit `bdc22535`, dans l'historique git) ont été revérifiés un par un, sans les présumer corrects.

## Perimeter coverage
Les 20 lignes du tableau « Replicated (core loop) / In scope » du PRD sont livrées par au moins une story (couverture 100 %) : Toolbar (s14), Selector (s13), Stepper (s16), Gauge (s15), Move modal (s18), Contact import (s21), Upload module (s20), Accordion (s11), Breadcrumb (s12), Combobox (s19), Skeleton (s09), Card (s10), Timeline (s17), Gantt (s22, s23, s24), corrections bugs et accessibilité (s01, s02, s03), petits contrôles de formulaire (s04), onglets horizontaux (s05), filtres (s07), partage (s08), waffle et menu utilisateur (s06).

- Les 19 tickets des critères de succès du PRD sont tous référencés dans les notes des stories.
- Le Gantt (5) est découpé en trois tranches 3, 4 et 4, dans l'ordre lecture seule, déplacement et redimensionnement, puis dépendances.

## Scope
- [ ] Un point reste ouvert sur le cimetière : voir le finding 1 (texte partagé et artefact design-system).
- [x] Aucune story ne dépasse le périmètre. Le correctif de s08 est vérifié : les critères ne portent plus que sur #203. Les tickets #151 et #313 sont explicitement exclus dans les notes.
- Pas de refonte des tokens ni de `ui-codemod`, pas d'app de démo, pas d'intégration applicative, pas de thème, pas de graphique ni de carte.

## Story quality
- [x] Aucune couche technique.
- [x] Les critères peuvent devenir des tests. Les ambiguïtés du premier rapport sont levées (s09, s14, s04, s05 à s08).
- [x] Notes agentiques présentes et utiles dans les 24 stories.
- [x] Aucun 5. Les 4 énoncent tous leur risque.

## The list as a whole
- [x] Dépendances exécutables : s18 dépend de s03, s21 de s20, s23 de s22, s24 de s23. Pas de cycle, pas de référence vers l'avant.
- [x] Ids conformes à `s<numéro>-<slug>`, uniques, de s01 à s24 sans trou.
- [ ] Un chevauchement potentiel reste ouvert : s13 face à s05 et s04 (finding 5).

## Findings
1. **major** — Texte partagé (toutes les stories) — Chaque story qui ajoute ou modifie un composant doit mettre à jour un artefact externe (claude.ai) : la page du composant, son entrée de catalogue et l'index du canevas. Le texte affirme que ce n'est pas un site de documentation et que Storybook reste la seule documentation. Cette affirmation contredit la description du livrable : une page par composant, un catalogue et un index forment, par leur forme, un site de documentation. Le cimetière du PRD exclut « Documentation site outside the existing Storybook ». Le PRD n'a aucun amendement (`## Amendements` est vide), donc rien n'enregistre l'exception ; la requalification n'existe que dans `stories.md`. Le livrable est aussi hors dépôt, donc invérifiable par un test ou une revue de diff. Il double enfin `docs/design-system.md`, que le pipeline produit via `/dm-design-system`. Pas classé critical parce qu'aucune story n'a pour objet de construire ce site et que l'artefact préexiste ; si l'humain juge qu'il s'agit bien d'un site de documentation, la sévérité monte à critical. À faire : soit consigner la justification dans `## Amendements` du PRD, soit sortir cette obligation des critères de livraison des stories.
2. **minor** — s06, s07, s08 — Les critères sont testables, mais seulement par snapshot et absence de littéraux. Ils ne vérifient pas la conformité à la référence de design approuvée. À citer à la planification.
3. **minor** — s18-move-modal — La dépendance sur s03 n'est pas justifiée dans les notes. Justifier ou retirer.
4. **minor** — s21-contact-import — La dépendance sur s20 est justifiée mais discutable (l'import lit un fichier local, s20 envoie). À dire explicitement dans les notes.
5. **minor** — s13-selector — Risque de doublon avec `Tabs` ou `Radio`, cadré par l'exigence d'un amendement du PRD en cas de fusion. À surveiller.
6. **minor** — s15-generic-gauge — « Design check pending » n'est noté que dans les notes agentiques, pas dans les dépendances.
7. **minor** — s24 / critère de succès du PRD — Aucune story ne demande une story Storybook avec un jeu de données de démonstration pour l'édition du Gantt.
8. **minor** — s19-combobox — La note cite « Cunningham issue #286 », ce qui contredit le texte partagé (« Issue numbers refer to suitenumerique/ui-kit »). Ajouter l'exception au texte partagé.

## Verdict
La couverture du périmètre est complète, sans couche technique ni 5 non découpé. Reste un point de fond : le texte partagé impose un artefact de pages de composants hors Storybook, qui ressemble à l'élément « documentation site outside the existing Storybook » du cimetière, sans amendement du PRD qui le justifie. Il doit être tranché avant de passer à `/dm-architect`.

Max severity: major
Stories ready: no
