import { useMemo, useState } from 'react';
import type { Analysis } from '../dsn/analyze';
import { RUB, decodeCode } from '../dsn/labels';
import { dash, frDate, siren as fmtSiren } from '../format';

type Tab = 'entreprises' | 'etablissements' | 'individus' | 'contrats';

const TABS: { id: Tab; label: string }[] = [
  { id: 'entreprises', label: 'Societes' },
  { id: 'etablissements', label: 'Etablissements' },
  { id: 'individus', label: 'Individus' },
  { id: 'contrats', label: 'Contrats' },
];

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-600">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-3 py-2 text-slate-700">{children}</td>;
}

export default function EntityTables({ analysis }: { analysis: Analysis }) {
  const [tab, setTab] = useState<Tab>('entreprises');
  const [q, setQ] = useState('');

  const needle = q.trim().toLowerCase();
  const match = (...vals: (string | undefined)[]) =>
    needle === '' || vals.some((v) => (v ?? '').toLowerCase().includes(needle));

  const individuLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of analysis.individus) {
      m.set(i.key, `${dash(i.nom)} ${dash(i.prenoms)}`.trim());
    }
    return m;
  }, [analysis.individus]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                tab === t.id ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher…"
          className="w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="thin-scroll max-h-[28rem] overflow-auto">
        <table className="min-w-full text-sm">
          {tab === 'entreprises' && (
            <>
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <Th>SIREN</Th>
                  <Th>APE</Th>
                  <Th>IDCC</Th>
                  <Th>Commune</Th>
                  <Th>Etabl.</Th>
                  <Th>Individus</Th>
                  <Th>Contrats</Th>
                  <Th>Fichiers</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.entreprises
                  .filter((e) => match(e.siren, e.ape, e.commune, e.idcc))
                  .map((e) => (
                    <tr key={e.key} className="hover:bg-slate-50">
                      <Td>{fmtSiren(e.siren)}</Td>
                      <Td>{dash(e.ape)}</Td>
                      <Td>{dash(e.idcc)}</Td>
                      <Td>{dash(e.commune)}</Td>
                      <Td>{e.etablissements.size}</Td>
                      <Td>{e.individus.size}</Td>
                      <Td>{e.nbContrats}</Td>
                      <Td>{e.sources.size}</Td>
                    </tr>
                  ))}
              </tbody>
            </>
          )}

          {tab === 'etablissements' && (
            <>
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <Th>SIREN</Th>
                  <Th>NIC</Th>
                  <Th>APET</Th>
                  <Th>CP</Th>
                  <Th>Commune</Th>
                  <Th>Individus</Th>
                  <Th>Contrats</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.etablissements
                  .filter((e) => match(e.siren, e.nic, e.ape, e.commune, e.codePostal))
                  .map((e) => (
                    <tr key={e.key} className="hover:bg-slate-50">
                      <Td>{fmtSiren(e.siren)}</Td>
                      <Td>{dash(e.nic)}</Td>
                      <Td>{dash(e.ape)}</Td>
                      <Td>{dash(e.codePostal)}</Td>
                      <Td>{dash(e.commune)}</Td>
                      <Td>{e.individus.size}</Td>
                      <Td>{e.nbContrats}</Td>
                    </tr>
                  ))}
              </tbody>
            </>
          )}

          {tab === 'individus' && (
            <>
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <Th>Nom</Th>
                  <Th>Prenoms</Th>
                  <Th>Sexe</Th>
                  <Th>Naissance</Th>
                  <Th>Age</Th>
                  <Th>NIR</Th>
                  <Th>Contrats</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.individus
                  .filter((i) => match(i.nom, i.prenoms, i.nir, i.ntt))
                  .map((i) => (
                    <tr key={i.key} className="hover:bg-slate-50">
                      <Td>{dash(i.nom)}</Td>
                      <Td>{dash(i.prenoms)}</Td>
                      <Td>{decodeCode(RUB.SEXE, i.sexe)}</Td>
                      <Td>{frDate(i.dateNaissance)}</Td>
                      <Td>{i.age ?? '—'}</Td>
                      <Td>{dash(i.nir ?? i.ntt)}</Td>
                      <Td>{i.contrats.length}</Td>
                    </tr>
                  ))}
              </tbody>
            </>
          )}

          {tab === 'contrats' && (
            <>
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <Th>Individu</Th>
                  <Th>Nature</Th>
                  <Th>CSP</Th>
                  <Th>Cadre/non cadre</Th>
                  <Th>Emploi</Th>
                  <Th>Debut</Th>
                  <Th>Fin</Th>
                  <Th>Quotite</Th>
                  <Th>N° contrat</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.contrats
                  .filter((c) =>
                    match(c.numero, c.libelleEmploi, c.nature, individuLabel.get(c.individuKey)),
                  )
                  .map((c) => (
                    <tr key={c.key} className="hover:bg-slate-50">
                      <Td>{individuLabel.get(c.individuKey) ?? '—'}</Td>
                      <Td>{decodeCode(RUB.NATURE_CONTRAT, c.nature)}</Td>
                      <Td>{decodeCode(RUB.STATUT_SALARIE, c.statut)}</Td>
                      <Td>{decodeCode(RUB.STATUT_CATEGORIEL_RC, c.statutCategoriel)}</Td>
                      <Td>{dash(c.libelleEmploi)}</Td>
                      <Td>{frDate(c.dateDebut)}</Td>
                      <Td>{frDate(c.dateFin)}</Td>
                      <Td>{dash(c.quotite)}</Td>
                      <Td>{dash(c.numero)}</Td>
                    </tr>
                  ))}
              </tbody>
            </>
          )}
        </table>
      </div>
    </section>
  );
}
