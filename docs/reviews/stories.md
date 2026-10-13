# Revue des stories, ui-kit fork (3ᵉ passe)

Relecture de `docs/stories.md` (24 stories) contre `docs/prd.md`, sans reprendre les conclusions des passes précédentes (rapports précédents dans l'historique git : `bdc22535`, `32b07156`). Le PRD, les stories, le gabarit de revue, `VERSION` et le gabarit `templates/prd.md` ont été relus pour juger l'amendement.

## Couverture du périmètre

| Fonctionnalité PRD (cœur) | Couverte par | OK ? |
|---|---|---|
| Toolbar (#217) | s14-toolbar | ✅ |
| Selector (#232) | s13-selector | ✅ |
| Stepper dans la modale (#188) | s16-modal-stepper | ✅ |
| Gauge générique (#220) | s15-generic-gauge | ✅ |
| Move modal (#198) | s18-move-modal | ✅ |
| Import de contacts via table (#187) | s21-contact-import | ✅ |
| Upload module (#186) | s20-upload-module | ✅ |
| Accordion | s11-accordion | ✅ |
| Breadcrumb | s12-breadcrumb | ✅ |
| Combobox | s19-combobox | ✅ |
| Skeleton | s09-skeleton | ✅ |
| Card | s10-card | ✅ |
| Timeline | s17-timeline | ✅ |
| Gantt (éditable dès la v1) | s22, s23, s24 (déplacement, redimensionnement, dépendances, story de démonstration) | ✅ |
| Correctifs bugs et accessibilité (#184, #183, #213, #309…) | s01 (#184), s02 (#183, #309), s03 (#213) | ✅ |
| Petites cases, radios, switch (#244, #269, #245) | s04-small-form-controls | ✅ |
| Nouveaux onglets horizontaux (#231) | s05-horizontal-tabs | ✅ |
| Mise à jour des filtres (#259) | s07-filters-update | ✅ |
| Mise à jour du partage (#203) | s08-share-modal-update | ✅ |
| Waffle et menu utilisateur (#278, #241) | s06-waffle-user-menu | ✅ |

20 lignes sur 20 sont couvertes. Tous les tickets ui-kit des critères de succès du PRD sont portés par une story (#184, #183, #213, #309, #244, #269, #245, #231, #259, #203, #278, #241, #217, #232, #188, #220, #198, #187, #186). Le critère « Gantt utilisable en édition sur un jeu de démonstration » est vérifiable grâce au dernier critère de s24.

- [x] Toutes les fonctionnalités du tableau « Replicated » sont livrées par au moins une story.

## Périmètre

- [x] Aucune story ne réintroduit un élément du cimetière.
  - Tokens, moteur de tokens et `ui-codemod` : s01, s04 et s06 passent par des tokens existants et ne les refondent pas.
  - Site de documentation ou application de démo hors Storybook : la démo de s24 est une story Storybook, donc dans le périmètre.
  - Intégrations applicatives, back-end et données réelles : s17 et s20 excluent explicitement le réseau et la récupération de données. s08 écarte #151 et #313 en exigeant un amendement préalable.
  - Nouveaux thèmes : aucun.
  - Visualisation de données autre que Timeline et Gantt : aucune.
- [x] Aucune story ne dépasse le périmètre, à une réserve près : l'artefact de design system, traité plus bas. Il est couvert par l'amendement.

## Jugement sur l'amendement `design-system-artifact`

**Conforme au gabarit.** `templates/prd.md` demande une entrée par feature avec le titre « date — v<version cible> — slug », puis trois champs : « Entre dans le périmètre », « Sorti du cimetière ? » avec justification, et « Stories ». Tout est là.
- La version v0.1.0 est cohérente avec le fichier `VERSION` (0.1.0).
- La justification dit ce qui a changé depuis la décision d'exclure : le propriétaire veut que la référence suive chaque livraison.
- Le cadrage est assez étroit pour ne pas vider le cimetière. Le site de documentation reste exclu pour tout ce qui s'adresse aux utilisateurs des composants. L'artefact est privé, interne, non publié, non livré avec les paquets, et Storybook reste la seule documentation officielle.

**Cohérence avec les stories.** Le texte partagé de `stories.md` renvoie à l'amendement et reprend les mêmes termes (privé, non publié, Storybook seule documentation officielle). Il n'y a plus de contradiction non justifiée avec le cimetière. La règle de la skill (« sortie du cimetière seulement avec justification dans `## Amendements` ») est respectée. Le point majeur de la 2ᵉ passe est levé.

## Qualité des stories

- [x] Chaque story est une tranche livrable de bout en bout. Aucune couche technique déguisée.
- [~] Presque tous les critères d'acceptation peuvent devenir un test. Exceptions mineures : m4 et m5.
- [x] Notes agentiques présentes et utiles dans les 24 stories.
- [x] Complexités renseignées et aucun 5 non découpé : le Gantt (5 dans le PRD) est découpé en 3, 4 et 4. Chaque 4 énonce son risque : s19, s20, s21, s23 et s24.

## Liste dans son ensemble

- [x] L'ordre des dépendances est exécutable : s18 dépend de s03, s21 de s20, s23 de s22 et s24 de s23. Il n'y a ni cycle ni référence vers l'avant. s15 est bloquée en attente d'une confirmation humaine (m6), mais aucune autre story ne dépend d'elle.
- [x] Ids bien formés (`s01` à `s24`), uniques et stables.
- [x] Pas de recouvrement, avec deux zones de frottement déjà traitées dans les notes : s13 contre Tabs et Radio (repli vers s05 ou s04 par amendement), s19 contre `Select` (décision renvoyée à la recherche).

## Constats

Aucun constat critique ni majeur.

- **minor, m1 : amendement.** « Stories : toutes (règle commune…) » s'écarte du gabarit, qui attend des ids de stories. Acceptable parce que la règle est commune, mais « toutes » ne tient pas compte de s15, bloquée.
- **minor, m2 : amendement.** Le texte dit « à chaque ticket » alors que `stories.md` dit « each story ». L'unité (ticket enfant ou story) devrait être alignée ; la mise à jour de l'artefact se jouera au niveau des tickets créés par `/dm-plan`.
- **minor, m3 : amendement et texte partagé.** La mise à jour de l'artefact figure dans le texte partagé mais dans aucun critère d'acceptation, donc elle ne peut pas devenir un test (lien claude.ai externe au dépôt). À préciser au moment de `/dm-plan` ou de `/dm-review`, par exemple par une case de checklist de ticket. L'amendement est en français dans un PRD en anglais (le gabarit est lui-même en français).
- **minor, m4 : s09, critère 3.** « Le conteneur qui l'enveloppe est celui marqué occupé par l'appelant » décrit la responsabilité de l'appelant et n'est pas testable sur le composant. Seuls `aria-hidden` et l'absence de focus sont vérifiables.
- **minor, m5 : s22 et s23, accessibilité clavier.** « Navigable au clavier » (s22) et « les mêmes changements possibles au clavier » (s23) ne précisent ni touches ni comportement attendu. À expliciter à la recherche ou au design.
- **minor, m6 : s15, dépendance.** « Bloquée tant que la vérification du design n'est pas confirmée » est une condition humaine, pas une story. Le statut du ticket devrait refléter ce blocage.
- **minor, m7 : s21, dépendance.** L'import lit un fichier local sans rien envoyer, alors que le module d'upload gère progression, annulation et nouvel essai. La dépendance à s20 est discutable ; la note le reconnaît et prévoit de la retirer si la recherche le confirme.
- **minor, m8 : s16, s19 et numéros de tickets.** Le numéro #286 désigne deux tickets différents : ui-kit #286 dans s16, Cunningham #286 dans s19. Le texte partagé signale l'exception pour s19, mais pas la collision. Préfixer la source dans les deux notes éviterait une confusion.

## Verdict

Max severity: minor
Stories ready: yes
