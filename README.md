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

`@barthgve/ui-components` est dérivé de `@gouvfr-lasuite/ui-components` et en
est indépendant depuis la version 2.0.0 (voir
l'[ADR 008](./docs/decisions/008-independent-project.md)). Il s'installe sous le
nom d'origine grâce à un alias
(`yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version>`,
voir [Installer le paquet](#installer-le-paquet)).

Le paquet de composants dépend du paquet de tokens par sa plage semver
publiée. Les versions des paquets sont indépendantes et gérées par Changesets.

Lancez la CLI de migration sans l'ajouter aux dépendances d'une application :

```bash
npx @gouvfr-lasuite/ui-codemod@1.0.0 migrate . --source all
```

npx télécharge la version exacte de la CLI dans le cache npm après
confirmation, et ne modifie ni le `package.json`, ni le fichier de verrouillage,
ni le `node_modules` du projet cible.

## Installer le paquet

`ui-components` est publié sur npm sous le nom `@barthgve/ui-components` par ce
dépôt. Le projet est dérivé de `suitenumerique/ui-kit` ; il en est
indépendant depuis la version 2.0.0 et ne suit plus les versions amont (voir
l'[ADR 008](./docs/decisions/008-independent-project.md)). Seul `ui-components`
est publié ici : `@gouvfr-lasuite/ui-tokens` et `@gouvfr-lasuite/ui-codemod`
restent les paquets amont. Le dépôt et le paquet sont publics, et les versions
publiées depuis le workflow GitHub portent la provenance npm.

Les versions suivent semver (`x.y.z`). Le numéro identifie le paquet sur npm, le
tag `ui-components@x.y.z` du dépôt et la
[Release GitHub](https://github.com/BarthGve/ui-kit-augmente/releases) du même
nom. Les versions antérieures à 2.0.0 (`1.4.0-fork.1` à `1.4.0-fork.9`) restent
installables. La version du
produit (`VERSION`, `CHANGELOG.md`, tags `v…`) est un autre numéro : elle ne
désigne jamais une version publiée du paquet.

### Installation par alias

Installez le paquet sous le nom `@gouvfr-lasuite/ui-components`, pour que les
imports de votre application correspondent aux exemples de la documentation.
Remplacez `<version>` par une version publiée, ou utilisez `latest` pour la plus
récente :

```bash
# Yarn
yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version> @tanstack/react-query
# npm
npm install @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version> @tanstack/react-query

# Dernière version publiée
yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@latest @tanstack/react-query
npm install @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@latest @tanstack/react-query
```

`@latest` installe la dernière version publiée. Une plage comme `^2.0.0` suit
les versions mineures et correctives suivantes. Une application sur une version
antérieure à 2.0.0 passe en 2.x en changeant seulement la version : l'alias et les
imports restent les mêmes.

### Installation depuis une archive de Release

Chaque Release porte en pièce jointe l'archive `.tgz` du paquet, celle que le
workflow a vérifiée avant la publication. Copiez l'URL de cette pièce jointe
depuis la page de la Release et installez-la sous le nom d'origine, sans passer
par npm :

```bash
# Yarn
yarn add "@gouvfr-lasuite/ui-components@<url-de-l-archive>" @tanstack/react-query
# npm
npm install "@gouvfr-lasuite/ui-components@<url-de-l-archive>" @tanstack/react-query
```

Le `package.json` et le fichier de verrouillage de l'application figent alors
cette URL.

### Installation depuis une archive locale

Utile pour tester une modification locale avant de la publier. Depuis la racine
de ce dépôt (dépendances installées, voir [Développement](#développement)),
construisez les paquets puis empaquetez `ui-components`. La version doit être
la version actuelle de `packages/ui-components/package.json` ; la dernière ligne
affichée est le chemin de l'archive :

```bash
yarn build
yarn package:pack 2.0.0 --out /chemin/vers/archive
```

Puis, dans l'application, installez l'archive sous le nom d'origine :

```bash
# Yarn
yarn add "@gouvfr-lasuite/ui-components@file:/chemin/vers/archive/barthgve-ui-components-2.0.0.tgz" @tanstack/react-query
# npm
npm install "@gouvfr-lasuite/ui-components@file:/chemin/vers/archive/barthgve-ui-components-2.0.0.tgz" @tanstack/react-query
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
manuellement. `@barthgve/ui-components` est publié en posant un tag
`ui-components@<version>` sur un commit de `main` : suivez
[`RELEASING.md`](./docs/RELEASING.md).

Consultez [`MIGRATION.md`](./docs/MIGRATION.md) pour les instructions de
migration côté consommateurs, et [`CONTRIBUTING.md`](./docs/CONTRIBUTING.md)
pour contribuer au projet.
