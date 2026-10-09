# Revue des stories : ui-kit fork (nouveaux composants et évolutions)

> Revue à contexte neuf de `docs/stories.md` contre `docs/prd.md`. Lecture seule, rien n'a été modifié.

## Perimeter coverage
| Fonctionnalité PRD (core loop) | Couverte par | OK ? |
|---|---|---|
| Toolbar (#217) | s14-toolbar | ✅ |
| Selector (#232) | s13-selector | ✅ |
| Stepper dans la modale (#188) | s16-modal-stepper | ✅ |
| Gauge générique (#220) | s15-generic-gauge | ✅ |
| Move modal (#198) | s18-move-modal | ✅ |
| Contact import via table (#187) | s21-contact-import | ✅ |
| Upload module (#186) | s20-upload-module | ✅ |
| Accordion | s11-accordion | ✅ |
| Breadcrumb | s12-breadcrumb | ✅ |
| Combobox | s19-combobox | ✅ |
| Skeleton | s09-skeleton | ✅ |
| Card | s10-card | ✅ |
| Timeline | s17-timeline | ✅ |
| Gantt (éditable dès la v1) | s22 (lecture seule), s23 (déplacer et redimensionner), s24 (dépendances) | ✅ |
| Corrections bugs et accessibilité (#184, #183, #213, #309…) | s01 (#184), s02 (#183, #309), s03 (#213) | ✅ |
| Petits checkbox, radio, switch (#244, #269, #245) | s04-small-form-controls | ✅ |
| Nouveaux onglets horizontaux (#231) | s05-horizontal-tabs | ✅ |
| Mise à jour des filtres (#259) | s07-filters-update | ✅ |
| Mise à jour du partage (#203) | s08-share-modal-update | ✅ |
| Waffle et menu utilisateur (#278, #241) | s06-waffle-user-menu | ✅ |

- [x] Les 20 lignes du tableau sont livrées par au moins une story (couverture 100 %).
- Les 19 tickets cités dans les critères de succès du PRD sont tous référencés dans les notes des stories.
- Le Gantt (complexité 5) est déjà découpé en trois tranches livrables (lecture seule, édition, dépendances). Ce découpage suit la consigne du PRD de livrer d'abord en lecture seule.
- L'expression « blocs communs » de la section Problème du PRD n'est pas une ligne du tableau. Elle n'exige donc pas de story.

## Scope
- [x] Aucune story ne réintroduit un élément du cimetière. Il n'y a aucune refonte des tokens ni de `ui-codemod`, aucune app de démo, aucune intégration applicative, aucun thème, aucun graphique ou carte autre que Timeline et Gantt.
- [ ] Une story dépasse le périmètre : voir les findings sur s08 et sur le texte partagé.

## Story quality
- [x] Aucune story n'est une couche technique. Chacune livre une valeur de bout en bout, et les stories s09 et s15 s'adressent à un développeur mais restent livrables seules.
- [ ] Tous les critères ne peuvent pas devenir un test : voir les findings.
- [x] Les notes agentiques sont présentes et utiles dans les 24 stories (fichiers, pièges, risques).
- [x] Aucun 5 n'est laissé en une seule story. Les 4 (s19, s20, s21, s23, s24) énoncent tous leur risque.

## The list as a whole
- [x] L'ordre des dépendances est exécutable : s18 dépend de s03, s21 de s20, s23 de s22 et s24 de s23. Il n'y a ni cycle ni référence vers l'avant.
- [x] Les ids respectent `s<numéro>-<slug>`, sont uniques et vont de s01 à s24 sans trou.
- [ ] Un chevauchement potentiel est à lever : voir le finding sur s13.

## Findings
1. **major** — s08-share-modal-update — Le périmètre du PRD est « Share update (#203) ». La story ajoute en plus #151 (masquer le mode invitation) et #313 (action « demander l'accès »), qui ne sont pas dans le PRD. Le critère « une action "demander l'accès" est disponible quand elle est activée » est une fonctionnalité nouvelle. La note dit elle-même « re-check the scope of #313 with the user », donc le doute est reconnu mais non tranché. À faire : retirer #313 et son critère, ou amender le PRD (`## Amendements`). Ajouter #151 au périmètre se décide de la même façon.
2. **minor** — s06, s07, s08 (et s05) — Le critère « rend le design approuvé, piloté par les tokens » n'est pas testable tel quel. Il n'a ni référence mesurable ni test visuel nommé (instantané Storybook, valeurs de tokens attendues). Les autres critères de ces stories sont bons. À faire : citer la référence de design vérifiée (valeurs de tokens, dimensions, états) ou un test d'instantané.
3. **minor** — s04-small-form-controls — Le critère « aire interactive minimale » n'a pas de valeur (par exemple 24×24 px). Il ne peut pas devenir un test en l'état.
4. **minor** — s09-skeleton, s14-toolbar — Les critères alternatifs sont ambigus. Pour s09, « masqué aux technologies d'assistance **ou** marqué occupé ». Pour s14, « menu de débordement **ou** retour à la ligne ». Il faut trancher, sinon le test n'est pas déterministe.
5. **minor** — Texte partagé de stories.md — Chaque story doit mettre à jour un artefact externe de design-system (page du composant, catalogue, index du canevas). Ce travail est hors dépôt. Il touche de près le graveyard « site de documentation en dehors de Storybook » et alourdit chaque story d'un livrable non testable dans le dépôt. À faire : confirmer qu'il s'agit d'un support interne de design et non d'un site de documentation. Sinon, le sortir des critères de livraison.
6. **minor** — s13-selector — Le risque de doublon avec `Tabs` ou `Radio` est reconnu dans les notes mais reporté à la recherche. Si le Selector est une variante visuelle d'un de ces deux composants, s13 chevauche s05 ou s04. À surveiller.
7. **minor** — s16 / s19 — Le numéro `#286` désigne deux choses différentes : un bug de padding des modales (s16) et le `Select` asynchrone (s19). L'une de ces références est fausse ou ambiguë. À corriger pour éviter une mauvaise traçabilité.
8. **minor** — s21-contact-import — Le PRD donne comme dépendance DataGrid, alors que la story dépend de s20 (upload). La dépendance est plausible parce que l'import passe par le choix d'un fichier. Elle n'est pas justifiée dans les notes et alourdit l'ordre de livraison. À faire : la justifier ou la retirer.

## Verdict
Aucune fonctionnalité du périmètre n'est oubliée, et il n'y a aucune fuite du cimetière, aucune couche technique ni aucun 5 non découpé. Le seul défaut notable est le dépassement de périmètre de s08 (#313). Les autres points sont des précisions rédactionnelles. Le correctif de s08 est rapide, après quoi la liste pourra passer au `/dm-architect` puis à la planification.

Max severity: major
Stories ready: no
