import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseDsn } from './parser';
import { analyze } from './analyze';
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
    // Racines : Envoi (S10.G00.00) + Declaration (S20.G00.05).
    const decl = roots.find((r) => r.block === 'S20.G00.05');
    expect(decl).toBeDefined();
    const ent = decl!.children.find((c) => c.block === 'S21.G00.06');
    expect(ent).toBeDefined();
    const etabs = ent!.children.filter((c) => c.block === 'S21.G00.11');
    expect(etabs).toHaveLength(2);
    const individusEtab1 = etabs[0].children.filter((c) => c.block === 'S21.G00.30');
    expect(individusEtab1).toHaveLength(3);
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
