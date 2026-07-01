import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseDsn } from './parser';
import type { DsnNode } from './model';
import { analyze } from './analyze';
import { RUB, getNomenclature } from './labels';
import { NORME, mergeRecord, normeChargee } from './norme';
import {
  contratsParCategorieCadre,
  contratsParNature,
  contratsParStatutSalarie,
  individusParSexe,
  individusParTrancheAge,
  kpis,
  repartitionTempsTravail,
} from './stats';

const sample = readFileSync(
  fileURLToPath(new URL('../sample/exemple.dsn', import.meta.url)),
  'utf8',
);

describe('parseDsn', () => {
  it('decoupe correctement une ligne', () => {
    const parsed = parseDsn("S21.G00.06.001,'123456789'\n", 'x.dsn');
    expect(parsed.roots[0].block).toBe('S21.G00.06');
    expect(parsed.roots[0].fields['001']).toBe('123456789');
  });

  it('reconstruit la hierarchie entreprise > etablissement > individu > contrat', () => {
    const { roots } = parseDsn(sample, 'exemple.dsn');
    const find = (block: string, nodes = roots): DsnNode[] =>
      nodes.flatMap((n) => (n.block === block ? [n] : find(block, n.children)));

    const ent = find('S21.G00.06');
    expect(ent).toHaveLength(1);
    const etabs = ent[0].children.filter((c) => c.block === 'S21.G00.11');
    expect(etabs).toHaveLength(2);
    const individusEtab1 = etabs[0].children.filter((c) => c.block === 'S21.G00.30');
    expect(individusEtab1).toHaveLength(3);
    expect(individusEtab1[0].children.some((c) => c.block === 'S21.G00.40')).toBe(true);
  });
});

describe('analyze', () => {
  const a = analyze([parseDsn(sample, 'exemple.dsn')]);

  it('compte les entites distinctes', () => {
    const k = kpis(a);
    expect(k.entreprises).toBe(1);
    expect(k.etablissements).toBe(2);
    expect(k.individus).toBe(5);
    expect(k.contrats).toBe(5);
  });

  it('dedoublonne entre plusieurs fichiers (meme periode = memes individus)', () => {
    const twice = analyze([
      parseDsn(sample, 'a.dsn'),
      parseDsn(sample, 'b.dsn'),
    ]);
    expect(kpis(twice).individus).toBe(5);
    expect(kpis(twice).contrats).toBe(5);
  });

  it('produit les repartitions pour les graphiques', () => {
    const nature = contratsParNature(a);
    const cdi = nature.find((s) => s.code === '01');
    expect(cdi?.value).toBe(2);

    const sexe = individusParSexe(a);
    expect(sexe.reduce((s, x) => s + x.value, 0)).toBe(5);

    const ages = individusParTrancheAge(a);
    expect(ages.reduce((s, x) => s + x.value, 0)).toBe(5);
  });

  it('deduit le sexe du NIR quand la rubrique .005 est absente', () => {
    // Deux individus sans S21.G00.30.005 : NIR commencant par 2 (femme) et 1 (homme).
    const dsn =
      "S21.G00.30.001,'253097512345678'\n" +
      "S21.G00.30.002,'AAA'\n" +
      "S21.G00.30.001,'180057898765432'\n" +
      "S21.G00.30.002,'BBB'\n";
    const r = analyze([parseDsn(dsn, 't.dsn')]);
    expect(r.individus.find((i) => i.nir === '253097512345678')?.sexe).toBe('02');
    expect(r.individus.find((i) => i.nir === '180057898765432')?.sexe).toBe('01');
    const sexe = individusParSexe(r);
    expect(sexe.find((s) => s.code === '01')?.value).toBe(1);
    expect(sexe.find((s) => s.code === '02')?.value).toBe(1);
  });

  it('repartit temps plein / temps partiel via les quotites', () => {
    const tt = repartitionTempsTravail(a);
    expect(tt.find((s) => s.label === 'Temps plein')?.value).toBe(3);
    expect(tt.find((s) => s.label === 'Temps partiel')?.value).toBe(2);
  });

  it('repartit cadre / non cadre via le statut categoriel (.003)', () => {
    const cat = contratsParCategorieCadre(a);
    expect(cat.find((s) => s.code === '01')?.value).toBe(2); // cadres
    expect(cat.find((s) => s.code === '04')?.value).toBe(3); // non cadres
  });

  it('repartit par categorie socio-professionnelle (.002)', () => {
    const csp = contratsParStatutSalarie(a);
    expect(csp.reduce((s, x) => s + x.value, 0)).toBe(5);
    expect(csp.find((s) => s.code === '06')?.value).toBe(1); // employe
  });

  it('remonte la convention collective (IDCC) au niveau entreprise', () => {
    expect(a.entreprises[0].idcc).toBe('1486');
    expect(a.entreprises[0].etablissements.size).toBe(2);
  });

  it('cumule la remuneration brute (type 001)', () => {
    // 4200 + 2450 + 1750 + 6800 + 2050
    expect(a.remunerationBruteTotale).toBeCloseTo(17250, 2);
  });
});

describe('couche de surcharge norme', () => {
  it('charge la norme officielle (norme.json) et expose sa version', () => {
    expect(normeChargee()).toBe(true);
    expect(NORME.version).toBe('CT2026.1.1');
  });

  it('les nomenclatures officielles ont priorite sur les defauts', () => {
    // Le cahier technique remplace le libelle court "CDI" par le libelle complet.
    expect(getNomenclature(RUB.NATURE_CONTRAT)['01']).toMatch(/duree indeterminee|durée indéterminée/i);
    expect(getNomenclature(RUB.STATUT_CATEGORIEL_RC)['04']).toMatch(/non cadre/i);
  });

  it('mergeRecord : la surcharge gagne, sinon defaut conserve', () => {
    const merged = mergeRecord({ '01': 'CDI', '02': 'CDD' }, { '02': 'CDD modifie', '03': 'Interim' });
    expect(merged['01']).toBe('CDI');
    expect(merged['02']).toBe('CDD modifie');
    expect(merged['03']).toBe('Interim');
  });
});
