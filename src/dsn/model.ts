// Modele de donnees DSN (Declaration Sociale Nominative)
//
// Un fichier DSN est un fichier texte plat compose de lignes au format :
//   S21.G00.30.001,'1234567890123'
// ou la partie de gauche est l'identifiant de rubrique et la partie de droite
// la valeur (entouree de quotes simples). Les blocs (ex: S21.G00.30) sont
// organises hierarchiquement : l'ordre des lignes et une table de parente
// definissent l'arborescence.

/** Une ligne brute analysee : { code, value, ligne }. */
export interface DsnLine {
  /** Identifiant complet de la rubrique, ex "S21.G00.30.001". */
  code: string;
  /** Valeur (sans les quotes), ex "1234567890123". */
  value: string;
  /** Numero de ligne dans le fichier source (1-based), pour le debug. */
  lineNumber: number;
}

/**
 * Un noeud de l'arborescence DSN. Chaque noeud correspond a une occurrence
 * d'un bloc (ex "S21.G00.30") et porte ses rubriques + ses enfants.
 */
export interface DsnNode {
  /** Code du bloc, ex "S21.G00.30". */
  block: string;
  /** Rubriques du bloc : code rubrique (ex "001") -> valeur. */
  fields: Record<string, string>;
  /** Sous-blocs. */
  children: DsnNode[];
  /** Identifiant unique du noeud dans l'arbre (pour React keys, drill-down). */
  id: string;
}

/** Resultat du parsing d'un fichier : son arbre + d'eventuelles anomalies. */
export interface ParsedFile {
  fileName: string;
  /** Noeuds racines (typiquement les blocs S10.G00.00 et S20.G00.05). */
  roots: DsnNode[];
  /** Nombre total de lignes analysees. */
  lineCount: number;
  /** Lignes non reconnues / ignorees. */
  warnings: string[];
}

/** Recupere la valeur d'une rubrique d'un noeud (ex node, "001"). */
export function field(node: DsnNode, rubrique: string): string | undefined {
  return node.fields[rubrique];
}
