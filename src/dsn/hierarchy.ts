// Hierarchie des blocs DSN (norme phase 3).
//
// Un fichier DSN est plat : la structure arborescente est implicite et se
// reconstruit grace a une table de parente. On declare ici, pour chaque bloc
// connu, son bloc parent direct. Les blocs racines (Envoi, Declaration) ont
// `null`.
//
// Strategie de parsing (cf parser.ts) :
//  - on maintient une pile de noeuds ouverts ;
//  - pour un bloc connu, on depile jusqu'a trouver son parent declare, puis on
//    l'y rattache ;
//  - un bloc inconnu est rattache au noeud courant (haut de pile) afin de ne
//    jamais perdre de donnee, meme si la norme evolue.
//
// Seuls les blocs porteurs de la synthese (06, 11, 30, 40, 50, 51) ont besoin
// d'une parente exacte ; ils sont ici verifies. Les autres facilitent
// l'affichage de l'arbre.

/** block -> parent block (null = racine). */
export const BLOCK_PARENT: Record<string, string | null> = {
  // --- Envoi ---
  'S10.G00.00': null, // Envoi
  'S10.G00.01': 'S10.G00.00', // Emetteur
  'S10.G00.02': 'S10.G00.01', // Contact emetteur

  // --- Declaration ---
  'S20.G00.05': null, // Declaration

  // --- Coeur metier ---
  'S21.G00.06': 'S20.G00.05', // Entreprise
  'S21.G00.11': 'S21.G00.06', // Etablissement
  'S21.G00.15': 'S21.G00.11', // Adhesion (prevoyance / complementaire)
  'S21.G00.16': 'S21.G00.15', // Code organisme
  'S21.G00.30': 'S21.G00.11', // Individu
  'S21.G00.31': 'S21.G00.30', // Changement Individu
  'S21.G00.40': 'S21.G00.30', // Contrat
  'S21.G00.41': 'S21.G00.40', // Changements Contrat
  'S21.G00.44': 'S21.G00.40', // Affectation fiscale
  'S21.G00.45': 'S21.G00.40', // Lieu de travail
  'S21.G00.50': 'S21.G00.40', // Versement individu (paie)
  'S21.G00.51': 'S21.G00.50', // Remuneration
  'S21.G00.52': 'S21.G00.50', // Prime, gratification et indemnite
  'S21.G00.53': 'S21.G00.50', // Autre element de revenu brut (autres)
  'S21.G00.54': 'S21.G00.50', // Autre element de revenu brut
  'S21.G00.55': 'S21.G00.50', // Indemnites
  'S21.G00.56': 'S21.G00.50', // Cotisation individuelle (ancien)
  'S21.G00.62': 'S21.G00.40', // Fin du contrat
  'S21.G00.70': 'S21.G00.40', // Affiliation prevoyance
  'S21.G00.78': 'S21.G00.50', // Base assujettie
  'S21.G00.79': 'S21.G00.78', // Composant de base assujettie
  'S21.G00.81': 'S21.G00.78', // Cotisation individuelle
};

/** Codes des blocs principaux, references depuis l'analyse. */
export const BLOCK = {
  ENVOI: 'S10.G00.00',
  EMETTEUR: 'S10.G00.01',
  DECLARATION: 'S20.G00.05',
  ENTREPRISE: 'S21.G00.06',
  ETABLISSEMENT: 'S21.G00.11',
  INDIVIDU: 'S21.G00.30',
  CONTRAT: 'S21.G00.40',
  VERSEMENT: 'S21.G00.50',
  REMUNERATION: 'S21.G00.51',
  FIN_CONTRAT: 'S21.G00.62',
} as const;

/** Libelle lisible d'un bloc. */
export const BLOCK_LABEL: Record<string, string> = {
  'S10.G00.00': 'Envoi',
  'S10.G00.01': 'Emetteur',
  'S10.G00.02': 'Contact emetteur',
  'S20.G00.05': 'Declaration',
  'S21.G00.06': 'Entreprise',
  'S21.G00.11': 'Etablissement',
  'S21.G00.15': 'Adhesion',
  'S21.G00.16': 'Code organisme',
  'S21.G00.30': 'Individu',
  'S21.G00.31': 'Changement individu',
  'S21.G00.40': 'Contrat',
  'S21.G00.41': 'Changement contrat',
  'S21.G00.44': 'Affectation fiscale',
  'S21.G00.45': 'Lieu de travail',
  'S21.G00.50': 'Versement (paie)',
  'S21.G00.51': 'Remuneration',
  'S21.G00.52': 'Prime / indemnite',
  'S21.G00.53': 'Autre revenu brut',
  'S21.G00.54': 'Autre revenu brut',
  'S21.G00.55': 'Indemnite',
  'S21.G00.56': 'Cotisation',
  'S21.G00.62': 'Fin de contrat',
  'S21.G00.70': 'Affiliation',
  'S21.G00.78': 'Base assujettie',
  'S21.G00.79': 'Composant de base assujettie',
  'S21.G00.81': 'Cotisation individuelle',
};

export function blockLabel(block: string): string {
  return BLOCK_LABEL[block] ?? block;
}
