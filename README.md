# La Suite numérique UI

Ce dépôt est la référence du design system de La Suite numérique. Il réunit les
anciens dépôts UI Kit et Cunningham dans un espace de travail Yarn 1 et
Turborepo privé.

Consultez la documentation unifiée des composants dans le
[Storybook](https://suitenumerique.github.io/ui-kit/) public.

Les sources de Cunningham sont un instantané sans historique du commit
[`3c13c21`](https://github.com/suitenumerique/cunningham/tree/3c13c21726d632a2a6ca41d2e7a4bbe28334c90b),
version React `4.3.1`.

## Paquets

| Paquet                                                | Rôle                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`@barthgve/ui-components`](./packages/ui-components) | Tous les composants React, icônes SVG, styles, polices, tests et documentation Storybook issus d'UI Kit et de Cunningham |
| [`@gouvfr-lasuite/ui-tokens`](./packages/ui-tokens)   | Moteur de tokens Cunningham, CLI, tokens par défaut, utilitaires de thème et générateurs CSS/SCSS/JS/TS                  |
| [`@gouvfr-lasuite/ui-codemod`](./packages/ui-codemod) | CLI de migration à usage unique (npx) pour les anciens noms de paquets et de sous-chemins publics                        |

`@barthgve/ui-components` est le fork de `@gouvfr-lasuite/ui-components`. Il
s'installe sous le nom d'origine grâce à un alias
(`yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version>`,
voir [Installer le fork](#installer-le-fork)).

Le paquet de composants dépend du paquet de tokens par sa plage semver
publiée. Les versions des paquets sont indépendantes et gérées par Changesets.

Lancez la CLI de migration sans l'ajouter aux dépendances d'une application :

```bash
npx @gouvfr-lasuite/ui-codemod@1.0.0 migrate . --source all
```

npx télécharge la version exacte de la CLI dans le cache npm après
confirmation, et ne modifie ni le `package.json`, ni le fichier de verrouillage,
ni le `node_modules` du projet cible.

## Installer le fork

`ui-components` est distribué par ce fork sur npm sous le nom
`@barthgve/ui-components`, avec des versions `x.y.z-fork.N` : `x.y.z` est la
version amont dont il dérive, `N` le numéro de publication du fork (par exemple
`1.4.0-fork.1`). Seul `ui-components` est distribué par le fork :
`@gouvfr-lasuite/ui-tokens` et `@gouvfr-lasuite/ui-codemod` restent les paquets
amont. Le dépôt est public et le paquet construit est public sur npm (voir
l'[ADR 005](./docs/decisions/005-publish-the-fork-on-npm.md)). Les publications
faites depuis le workflow GitHub portent la provenance npm ; la première
version, `1.4.0-fork.1`, a été publiée à la main et n'en porte pas.

### Installation par alias

Installez le fork sous le nom d'origine, pour que les imports de votre
application restent `@gouvfr-lasuite/ui-components`. Remplacez `<version>` par
une version publiée du fork (par exemple `1.4.0-fork.6`), ou utilisez
`latest` pour la plus récente :

```bash
# Yarn
yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version> @tanstack/react-query
# npm
npm install @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version> @tanstack/react-query

# Dernière version publiée
yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@latest @tanstack/react-query
npm install @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@latest @tanstack/react-query
```

`@latest` installe la dernière version publiée du fork. Les versions
`-fork.N` sont des préversions semver : une plage comme `^1.4.0` ou `*` ne les
sélectionne pas.

### Installation depuis une archive

Utile pour tester une modification locale avant de la publier. Depuis la racine
de ce dépôt (dépendances installées, voir [Développement](#développement)),
construisez les paquets puis empaquetez `ui-components` sous le nom du fork. La
base de la version doit être la version actuelle de
`packages/ui-components/package.json` ; la dernière ligne affichée est le chemin
de l'archive :

```bash
yarn build
yarn fork:stage 1.4.0-fork.1 --out /chemin/vers/fork-archive
```

Puis, dans l'application, installez l'archive sous le nom d'origine :

```bash
# Yarn
yarn add "@gouvfr-lasuite/ui-components@file:/chemin/vers/fork-archive/barthgve-ui-components-1.4.0-fork.1.tgz" @tanstack/react-query
# npm
npm install "@gouvfr-lasuite/ui-components@file:/chemin/vers/fork-archive/barthgve-ui-components-1.4.0-fork.1.tgz" @tanstack/react-query
```

Le `package.json` et le fichier de verrouillage de l'application figent alors
le chemin de l'archive (Yarn l'écrit en absolu, npm en relatif) : gardez
l'archive à un endroit accessible à l'application, et repassez à l'installation
par alias dès que la version est publiée.

### Dépendances de pairs et styles

React 19, React DOM 19 et TanStack React Query 5 sont des dépendances de pairs ;
`ui-tokens` est installé de façon transitive. Les deux gestionnaires de paquets
signalent que `use-resize-observer`, une dépendance, déclare React jusqu'à la
version 18 (npm : `ERESOLVE overriding peer dependency` ; Yarn :
`incorrect peer dependency`). L'avertissement n'est pas bloquant et
`--legacy-peer-deps` n'est pas nécessaire. Importez les styles et les polices
une seule fois depuis le point d'entrée de l'application, comme décrit dans le
[README du paquet](./packages/ui-components/README.md) :

```tsx
import "@gouvfr-lasuite/ui-components/style";
import "@gouvfr-lasuite/ui-components/fonts/roboto";
import "@gouvfr-lasuite/ui-components/fonts/marianne";
import "@gouvfr-lasuite/ui-components/fonts/material-icons";
```

## Développement

Node 24 (la version fixée dans `.nvmrc`) et Yarn 1.22.22 sont requis.

```bash
yarn install --frozen-lockfile
yarn build
yarn lint
yarn test
yarn test:ct
yarn build-storybook
```

Lancez la documentation unifiée en local avec `yarn storybook`. Ajoutez une note
de version avec `yarn changeset`. Les paquets amont sont versionnés et publiés
manuellement : suivez [`RELEASING.md`](./docs/RELEASING.md) pour la procédure
complète. Le fork, lui, est publié en posant un tag `fork@<version>` sur un
commit de `main` (voir l'[ADR 005](./docs/decisions/005-publish-the-fork-on-npm.md)).

Consultez [`MIGRATION.md`](./docs/MIGRATION.md) pour les instructions de
migration côté consommateurs, et [`CONTRIBUTING.md`](./docs/CONTRIBUTING.md)
pour contribuer au projet.
