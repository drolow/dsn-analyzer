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
  pyramide des âges, temps plein/temps partiel, effectif par établissement.
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

## Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` build et publie l'application sur
GitHub Pages à chaque push sur `main`. Pour l'activer une première fois :
**Settings → Pages → Build and deployment → Source → « GitHub Actions »**.
L'URL sera `https://<utilisateur>.github.io/dsn-analyzer/`, ouvrable depuis
n'importe quel navigateur (mobile compris). Le traitement restant 100 % côté
client, aucune donnée DSN n'est envoyée au serveur.

> Dépôt privé : GitHub Pages nécessite un plan payant. Sur un compte gratuit,
> rendez le dépôt public (le code ne contient aucune donnée), ou déployez sur
> Netlify / Cloudflare Pages (build `npm run build`, dossier publié `dist`).

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

### Source officielle : cahier technique NEODeS

Les blocs, libellés de rubriques et nomenclatures proviennent du **cahier
technique officiel `CT2026.1.1`**, embarqué dans `src/dsn/norme.json` (voir
ci-dessous le mécanisme de surcharge). Cela couvre notamment :

- hiérarchie et libellés des 30 blocs principaux ;
- 204 libellés de rubriques ;
- nomenclatures : nature du contrat `S21.G00.40.007`, statut du salarié
  conventionnel `S21.G00.40.002`, statut catégoriel Retraite Complémentaire
  `S21.G00.40.003` (cadre/non cadre), nature/type de déclaration, sexe, motif de
  rupture `S21.G00.62.002`, type de rémunération `S21.G00.51.011`.

Points confirmés par la norme :

- **convention collective (IDCC)** : portée par `S21.G00.06.015` (entreprise),
  avec repli sur `S21.G00.40.017` (contrat) ;
- **masse salariale brute** : somme du type `001` (« Rémunération brute non
  plafonnée ») du bloc `S21.G00.51`, sans le type `002` (assiette chômage) pour
  éviter le double comptage ;
- **effectif établissement** : le bloc `S21.G00.11` ne comporte aucune rubrique
  d'effectif ; l'effectif par établissement affiché est donc **calculé** (nombre
  d'individus distincts rattachés), pas lu dans le fichier.

Le parser a par ailleurs été validé sur un vrai fichier DSN mensuel (éditeur
Silae). Pour tout code hors nomenclature, l'UI affiche le code brut (aucune
perte).

### Surcharger avec le cahier technique officiel (`norme.json`)

L'application embarque des valeurs par défaut, mais peut être **alimentée par le
cahier technique officiel** via le fichier `src/dsn/norme.json`. Ce fichier est
fusionné par-dessus les défauts au chargement : ce qu'il renseigne fait foi, le
reste retombe sur les valeurs intégrées. Il peut donc être partiel ou vide.

Schéma :

```json
{
  "version": "CT2026.1.1",
  "meta": { "remunerationBruteTypes": ["001"] },
  "blocks":        { "S21.G00.40": { "label": "Contrat", "parent": "S21.G00.30" } },
  "fields":        { "S21.G00.40.007": "Nature du contrat" },
  "nomenclatures": { "S21.G00.40.007": { "01": "CDI", "02": "CDD" } },
  "_warnings": []
}
```

- `blocks` → hiérarchie (`parent`) et libellés des blocs ;
- `fields` → libellés des rubriques ;
- `nomenclatures` → décodage des valeurs (code → libellé) ;
- `meta.remunerationBruteTypes` → code(s) de `S21.G00.51.011` comptant comme
  rémunération brute (défaut `["001"]`).

Le pied de page indique si une norme officielle est chargée. Ce `norme.json`
peut être généré depuis le cahier technique (par ex. via un MCP `dsn-cahier-technique`)
puis déposé tel quel — aucune modification de code n'est nécessaire.

Les fichiers acceptés portent l'extension `.dsn`, `.edi` ou `.txt` (le format
est de toute façon détecté par le contenu, pas par l'extension).

⚠️ Ne committez jamais de vrais fichiers DSN : `.gitignore` exclut déjà
`*.dsn` et `*.edi` (sauf les exemples fictifs de `src/sample/`).
