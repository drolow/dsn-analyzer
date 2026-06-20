// Analyse : arborescence(s) DSN -> synthese exploitable par l'UI.

import { BLOCK } from './hierarchy';
import type { DsnNode, ParsedFile } from './model';
import { field } from './model';

export interface EntrepriseRec {
  key: string; // SIREN
  siren?: string;
  nicSiege?: string;
  ape?: string;
  idcc?: string;
  codePostal?: string;
  commune?: string;
  etablissements: Set<string>; // NIC distincts
  individus: Set<string>; // cles individus distincts
  nbContrats: number;
  sources: Set<string>; // fichiers
}

export interface EtablissementRec {
  key: string; // SIREN + NIC
  siren?: string;
  nic?: string;
  ape?: string;
  codePostal?: string;
  commune?: string;
  effectif?: string;
  individus: Set<string>;
  nbContrats: number;
}

export interface ContratRec {
  key: string;
  numero?: string;
  dateDebut?: string;
  dateFin?: string;
  nature?: string; // code
  statut?: string; // code
  pcs?: string;
  libelleEmploi?: string;
  quotite?: string; // S21.G00.40.013
  quotiteRef?: string; // S21.G00.40.012
  idcc?: string; // S21.G00.40.017 (convention collective)
  siren?: string;
  nic?: string;
  individuKey: string;
}

export interface IndividuRec {
  key: string; // NIR ou NTT ou nom|prenom|naissance
  nir?: string;
  ntt?: string;
  nom?: string;
  prenoms?: string;
  sexe?: string; // code brut
  dateNaissance?: string;
  age?: number;
  codePostal?: string;
  commune?: string;
  siren?: string;
  nic?: string;
  contrats: ContratRec[];
}

export interface DeclarationInfo {
  fichier: string;
  type?: string;
  moisPrincipal?: string;
  numeroOrdre?: string;
}

export interface Analysis {
  entreprises: EntrepriseRec[];
  etablissements: EtablissementRec[];
  individus: IndividuRec[];
  contrats: ContratRec[];
  declarations: DeclarationInfo[];
  /** Remuneration brute cumulee (type 001), indicative. */
  remunerationBruteTotale: number;
  /** Remuneration nette fiscale cumulee (S21.G00.50.002), indicative. */
  remunerationNetteTotale: number;
  /** Date de reference utilisee pour le calcul des ages. */
  ageRef: Date;
  files: { fileName: string; lineCount: number; warnings: number }[];
}

/** Parse une date DSN "JJMMAAAA" en Date locale. */
export function parseDsnDate(s?: string): Date | undefined {
  if (!s || s.length !== 8) return undefined;
  const d = Number(s.slice(0, 2));
  const m = Number(s.slice(2, 4));
  const y = Number(s.slice(4, 8));
  if (!d || !m || !y) return undefined;
  return new Date(y, m - 1, d);
}

/** Annee/mois depuis une date DSN "JJMMAAAA" ou "MMAAAA". */
function monthYear(s?: string): { year: number; month: number } | undefined {
  if (!s) return undefined;
  if (s.length === 8) return { month: Number(s.slice(2, 4)), year: Number(s.slice(4, 8)) };
  if (s.length === 6) return { month: Number(s.slice(0, 2)), year: Number(s.slice(2, 6)) };
  return undefined;
}

function toAmount(s?: string): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function ageFrom(birth: Date, ref: Date): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

/** Cle d'individu : NIR, sinon NTT, sinon empreinte nom/prenom/naissance. */
function individuKey(node: DsnNode): string {
  const nir = field(node, '001');
  if (nir && nir.trim()) return `NIR:${nir.trim()}`;
  const ntt = field(node, '020');
  if (ntt && ntt.trim()) return `NTT:${ntt.trim()}`;
  return `X:${field(node, '002') ?? ''}|${field(node, '004') ?? ''}|${field(node, '006') ?? ''}`;
}

/**
 * Analyse un ensemble de fichiers parses et produit la synthese consolidee
 * (dedoublonnage des entites entre fichiers / periodes).
 */
export function analyze(parsed: ParsedFile[]): Analysis {
  const entreprises = new Map<string, EntrepriseRec>();
  const etablissements = new Map<string, EtablissementRec>();
  const individus = new Map<string, IndividuRec>();
  const contrats = new Map<string, ContratRec>();
  const declarations: DeclarationInfo[] = [];
  let remunerationBruteTotale = 0;
  let remunerationNetteTotale = 0;

  // Date de reference pour les ages : mois principal le plus recent, sinon
  // aujourd'hui.
  let ageRef = new Date();
  let latest = -Infinity;

  interface Ctx {
    fileName: string;
    siren?: string;
    nic?: string;
    individuKey?: string;
    individuRec?: IndividuRec;
  }

  // --- parcours principal ---
  function walk(node: DsnNode, ctx: Ctx) {
    let next = ctx;

    switch (node.block) {
      case BLOCK.DECLARATION: {
        const my = monthYear(field(node, '005'));
        if (my) {
          const t = my.year * 12 + my.month;
          if (t > latest) {
            latest = t;
            ageRef = new Date(my.year, my.month - 1, 1);
          }
        }
        declarations.push({
          fichier: ctx.fileName,
          // .001 = nature (DSN mensuelle / signalement), .002 = type.
          type: field(node, '001'),
          moisPrincipal: field(node, '005'),
          numeroOrdre: field(node, '003'),
        });
        break;
      }
      case BLOCK.ENTREPRISE: {
        const siren = field(node, '001');
        const key = siren ?? `?${node.id}`;
        let rec = entreprises.get(key);
        if (!rec) {
          rec = {
            key,
            siren,
            nicSiege: field(node, '002'),
            ape: field(node, '003'),
            idcc: undefined, // renseigne depuis le contrat (.017)
            codePostal: field(node, '005'),
            commune: field(node, '006'),
            etablissements: new Set(),
            individus: new Set(),
            nbContrats: 0,
            sources: new Set(),
          };
          entreprises.set(key, rec);
        }
        rec.sources.add(ctx.fileName);
        next = { ...ctx, siren };
        break;
      }
      case BLOCK.ETABLISSEMENT: {
        const nic = field(node, '001');
        const key = `${ctx.siren ?? '?'}-${nic ?? node.id}`;
        let rec = etablissements.get(key);
        if (!rec) {
          rec = {
            key,
            siren: ctx.siren,
            nic,
            ape: field(node, '002'),
            codePostal: field(node, '004'),
            commune: field(node, '005'),
            effectif: field(node, '015'),
            individus: new Set(),
            nbContrats: 0,
          };
          etablissements.set(key, rec);
        }
        if (ctx.siren && nic) entreprises.get(ctx.siren)?.etablissements.add(nic);
        next = { ...ctx, nic };
        break;
      }
      case BLOCK.INDIVIDU: {
        const ik = individuKey(node);
        let rec = individus.get(ik);
        if (!rec) {
          const birth = parseDsnDate(field(node, '006'));
          rec = {
            key: ik,
            nir: field(node, '001'),
            ntt: field(node, '020'),
            nom: field(node, '002'),
            prenoms: field(node, '004'),
            sexe: field(node, '005'),
            dateNaissance: field(node, '006'),
            age: birth ? ageFrom(birth, ageRef) : undefined,
            codePostal: field(node, '009'),
            commune: field(node, '010'),
            siren: ctx.siren,
            nic: ctx.nic,
            contrats: [],
          };
          individus.set(ik, rec);
        }
        // Rattachements pour les compteurs entreprise / etablissement.
        if (ctx.siren) entreprises.get(ctx.siren)?.individus.add(ik);
        const etabKey = `${ctx.siren ?? '?'}-${ctx.nic ?? '?'}`;
        etablissements.get(etabKey)?.individus.add(ik);
        next = { ...ctx, individuKey: ik, individuRec: rec };
        break;
      }
      case BLOCK.CONTRAT: {
        const numero = field(node, '009');
        const dateDebut = field(node, '001');
        const key = `${ctx.individuKey ?? '?'}|${numero ?? ''}|${dateDebut ?? ''}`;
        if (!contrats.has(key)) {
          const rec: ContratRec = {
            key,
            numero,
            dateDebut,
            nature: field(node, '007'),
            statut: field(node, '002'),
            pcs: field(node, '004'),
            libelleEmploi: field(node, '006'),
            quotite: field(node, '013'),
            quotiteRef: field(node, '012'),
            idcc: field(node, '017'),
            siren: ctx.siren,
            nic: ctx.nic,
            individuKey: ctx.individuKey ?? '?',
          };
          contrats.set(key, rec);
          ctx.individuRec?.contrats.push(rec);
          if (ctx.siren) {
            const e = entreprises.get(ctx.siren);
            if (e) {
              e.nbContrats++;
              if (!e.idcc && rec.idcc) e.idcc = rec.idcc;
            }
          }
          const etabKey = `${ctx.siren ?? '?'}-${ctx.nic ?? '?'}`;
          const etab = etablissements.get(etabKey);
          if (etab) etab.nbContrats++;
        }
        break;
      }
      case BLOCK.FIN_CONTRAT: {
        // Renseigne la date de fin du dernier contrat de l'individu courant.
        const fin = field(node, '001');
        if (fin && ctx.individuRec && ctx.individuRec.contrats.length > 0) {
          const last = ctx.individuRec.contrats[ctx.individuRec.contrats.length - 1];
          if (!last.dateFin) last.dateFin = fin;
        }
        break;
      }
      case BLOCK.REMUNERATION: {
        const type = field(node, '011');
        const montant = toAmount(field(node, '013'));
        if (type === '001') remunerationBruteTotale += montant;
        break;
      }
      case BLOCK.VERSEMENT: {
        remunerationNetteTotale += toAmount(field(node, '002'));
        break;
      }
    }

    for (const child of node.children) walk(child, next);
  }

  for (const file of parsed) {
    for (const root of file.roots) {
      walk(root, { fileName: file.fileName });
    }
  }

  // Seconde passe : ages calcules avec la date de reference definitive.
  for (const ind of individus.values()) {
    const birth = parseDsnDate(ind.dateNaissance);
    ind.age = birth ? ageFrom(birth, ageRef) : undefined;
  }

  return {
    entreprises: [...entreprises.values()],
    etablissements: [...etablissements.values()],
    individus: [...individus.values()],
    contrats: [...contrats.values()],
    declarations,
    remunerationBruteTotale,
    remunerationNetteTotale,
    ageRef,
    files: parsed.map((f) => ({
      fileName: f.fileName,
      lineCount: f.lineCount,
      warnings: f.warnings.length,
    })),
  };
}
