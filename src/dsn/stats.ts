// Statistiques derivees de l'analyse, pretes pour les graphiques.

import type { Analysis } from './analyze';
import { NATURE_CONTRAT, SEXE, STATUT_CONVENTIONNEL } from './labels';

export interface Slice {
  label: string;
  value: number;
  /** Code brut (utile pour debug / tri). */
  code?: string;
}

function tally(values: (string | undefined)[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of values) {
    const key = v && v.trim() ? v.trim() : '—';
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return m;
}

function toSlices(
  m: Map<string, number>,
  decode?: Record<string, string>,
): Slice[] {
  return [...m.entries()]
    .map(([code, value]) => ({
      code,
      value,
      label: decode && decode[code] ? decode[code] : code,
    }))
    .sort((a, b) => b.value - a.value);
}

export function contratsParNature(a: Analysis): Slice[] {
  return toSlices(tally(a.contrats.map((c) => c.nature)), NATURE_CONTRAT);
}

export function contratsParStatut(a: Analysis): Slice[] {
  return toSlices(tally(a.contrats.map((c) => c.statut)), STATUT_CONVENTIONNEL);
}

export function individusParSexe(a: Analysis): Slice[] {
  return toSlices(tally(a.individus.map((i) => i.sexe)), SEXE);
}

const TRANCHES: { label: string; min: number; max: number }[] = [
  { label: '< 25 ans', min: 0, max: 24 },
  { label: '25-34 ans', min: 25, max: 34 },
  { label: '35-44 ans', min: 35, max: 44 },
  { label: '45-54 ans', min: 45, max: 54 },
  { label: '55 ans et +', min: 55, max: 200 },
];

export function individusParTrancheAge(a: Analysis): Slice[] {
  const counts = TRANCHES.map(() => 0);
  let inconnus = 0;
  for (const ind of a.individus) {
    if (ind.age == null) {
      inconnus++;
      continue;
    }
    const idx = TRANCHES.findIndex((t) => ind.age! >= t.min && ind.age! <= t.max);
    if (idx >= 0) counts[idx]++;
  }
  const slices: Slice[] = TRANCHES.map((t, i) => ({ label: t.label, value: counts[i] }));
  if (inconnus > 0) slices.push({ label: 'Inconnu', value: inconnus });
  return slices;
}

/** Effectif (individus distincts) par etablissement, trie decroissant. */
export function effectifParEtablissement(a: Analysis): Slice[] {
  return a.etablissements
    .map((e) => ({
      label: `${e.siren ?? '?'} / ${e.nic ?? '?'}${e.commune ? ` — ${e.commune}` : ''}`,
      value: e.individus.size,
    }))
    .sort((x, y) => y.value - x.value);
}

/** Compteurs distincts pour les cartes KPI. */
export function kpis(a: Analysis) {
  return {
    entreprises: a.entreprises.length,
    etablissements: a.etablissements.length,
    individus: a.individus.length,
    contrats: a.contrats.length,
    declarations: a.declarations.length,
  };
}
