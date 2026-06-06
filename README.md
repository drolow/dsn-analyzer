# Analyseur DSN

Application web pour **lire et analyser des fichiers DSN** (Déclaration Sociale
Nominative, norme phase 3) et en produire une **synthèse claire avec
graphiques** : nombre de sociétés, d'établissements, d'individus et de contrats,
avec leurs informations importantes.

> 🔒 **100 % local.** Le parsing et l'analyse se font entièrement dans le
> navigateur. Aucun fichier n'est envoyé à un serveur — essentiel vu la
> sensibilité des données DSN (NIR, salaires, données personnelles).

## Fonctionnalités

- **Multi-fichiers** : glisser-déposer un ou plusieurs fichiers, avec
  dédoublonnage automatique entre périodes (sociétés par SIREN, établissements
  par SIREN+NIC, individus par NIR/NTT, contrats par individu+numéro+date).
- **Synthèse / KPI** : sociétés, établissements, individus, contrats,
  déclarations, rémunération brute et net fiscal cumulés (indicatifs).
- **Graphiques** : répartition des contrats par nature (CDI/CDD/…), par sexe,
  pyramide des âges, répartition cadre/non-cadre, effectif par établissement.
- **Tables détaillées** par entité avec recherche.

## Démarrage

```bash
npm install
npm run dev        # serveur de dev (Vite)
npm run build      # build de production (dossier dist/)
npm run preview    # prévisualise le build
npm test           # tests unitaires (parser + analyse)
```

Ouvrez l'application, glissez vos fichiers DSN (ou cliquez sur **« Charger un
exemple »** pour voir une démo avec des données fictives).

## Architecture

```
src/
  dsn/
    model.ts       Types (lignes, noeuds, arbre, fichier parsé)
    hierarchy.ts   Table de parenté des blocs DSN + libellés des blocs
    labels.ts      Libellés des rubriques + nomenclatures (sexe, nature contrat…)
    parser.ts      Texte plat -> arborescence (algorithme à pile)
    analyze.ts     Arborescence -> synthèse consolidée (dédoublonnée)
    stats.ts       Statistiques dérivées pour les graphiques
  components/      UI React (dropzone, dashboard, cartes, graphiques, tables)
  format.ts        Formatage (dates, euros, SIREN)
  sample/          Fichier DSN d'exemple (fictif) pour la démo et les tests
```

### Comment fonctionne le parsing

Un fichier DSN est un fichier texte plat dont chaque ligne est de la forme :

```
S21.G00.30.001,'1234567890123'
```

La structure arborescente est **implicite** : elle se reconstruit à partir de
l'ordre des lignes et d'une **table de parenté des blocs**
(`hierarchy.ts`). Le parser maintient une pile de blocs ouverts et rattache
chaque nouveau bloc à son parent déclaré. Un bloc inconnu est rattaché au bloc
courant afin de **ne jamais perdre de donnée**, même si la norme évolue.

Hiérarchie principale exploitée pour la synthèse :

```
S21.G00.06 Entreprise
└─ S21.G00.11 Établissement
   └─ S21.G00.30 Individu
      └─ S21.G00.40 Contrat
         └─ S21.G00.50 Versement
            └─ S21.G00.51 Rémunération
```

## Valider avec vos vrais fichiers

Le parser est **générique** : il fonctionne quel que soit le contenu. Pour
affiner, déposez un fichier DSN réel (idéalement anonymisé) et vérifiez les
compteurs et les tables. Deux points d'amélioration faciles si besoin :

- **Libellés de rubriques** (`src/dsn/labels.ts`) : ajouter/corriger les
  rubriques propres à vos déclarations.
- **Indicateurs financiers** : la rémunération brute cumulée additionne les
  montants de type `001` (brut non plafonné) du bloc `S21.G00.51`, et le net
  fiscal additionne `S21.G00.50.002`. Ces montants sont **indicatifs** et
  dépendent des conventions de paie ; à valider sur vos données.

⚠️ Ne committez jamais de vrais fichiers DSN : `.gitignore` exclut déjà
`*.dsn` (sauf les exemples fictifs de `src/sample/`).
