// Couche de surcharge "norme officielle".
//
// L'application embarque des valeurs par defaut (hierarchy.ts, labels.ts)
// suffisantes pour fonctionner. Ce module charge un fichier `norme.json`
// optionnel — typiquement genere depuis le cahier technique officiel (via le
// MCP `dsn-cahier-technique`) — et le FUSIONNE par-dessus ces defauts.
//
// Regle : le JSON, quand il renseigne une cle, fait foi ; sinon le defaut
// s'applique. Le fichier peut donc etre partiel (ou vide) sans rien casser.

import rawNorme from './norme.json';

export interface NormeMeta {
  /** Code(s) de S21.G00.51.011 comptant comme remuneration brute (anti double-compte). */
  remunerationBruteTypes?: string[];
}

export interface NormeBlock {
  label?: string;
  /** Code du bloc parent, ou null pour une racine. */
  parent?: string | null;
}

export interface NormeData {
  version?: string | null;
  meta?: NormeMeta;
  /** Hierarchie + libelles des blocs (ex "S21.G00.40"). */
  blocks?: Record<string, NormeBlock>;
  /** Libelles des rubriques (ex "S21.G00.40.007" -> "Nature du contrat"). */
  fields?: Record<string, string>;
  /** Nomenclatures : rubrique -> { code valeur -> libelle }. */
  nomenclatures?: Record<string, Record<string, string>>;
  _warnings?: string[];
}

export const NORME: NormeData = rawNorme as NormeData;

/** Indique si un fichier de norme officiel a ete charge (non vide). */
export function normeChargee(n: NormeData = NORME): boolean {
  return Boolean(
    n.version ||
      (n.blocks && Object.keys(n.blocks).length) ||
      (n.fields && Object.keys(n.fields).length) ||
      (n.nomenclatures && Object.keys(n.nomenclatures).length),
  );
}

/** Fusionne un enregistrement de surcharge par-dessus une base (override gagne). */
export function mergeRecord<T>(
  base: Record<string, T>,
  override?: Record<string, T>,
): Record<string, T> {
  return override ? { ...base, ...override } : { ...base };
}
