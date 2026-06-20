import type { Analysis } from '../dsn/analyze';
import { kpis } from '../dsn/stats';
import { euros, frDate, num } from '../format';
import { NATURE_DECLARATION, decode } from '../dsn/labels';

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

export default function SummaryCards({ analysis }: { analysis: Analysis }) {
  const k = kpis(analysis);
  const periodes = [...new Set(analysis.declarations.map((d) => d.moisPrincipal).filter(Boolean))]
    .map((p) => frDate(p))
    .sort();
  const types = [...new Set(analysis.declarations.map((d) => d.type).filter(Boolean))]
    .map((t) => decode(NATURE_DECLARATION, t))
    .join(', ');

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Societes" value={num(k.entreprises)} accent="text-brand-600" />
        <Kpi label="Etablissements" value={num(k.etablissements)} accent="text-emerald-600" />
        <Kpi label="Individus" value={num(k.individus)} accent="text-amber-600" />
        <Kpi label="Contrats" value={num(k.contrats)} accent="text-violet-600" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi
          label="Remuneration brute cumulee (indicatif)"
          value={euros(analysis.remunerationBruteTotale)}
          accent="text-slate-700"
        />
        <Kpi
          label="Net fiscal cumule (indicatif)"
          value={euros(analysis.remunerationNetteTotale)}
          accent="text-slate-700"
        />
        <Kpi label="Declarations analysees" value={num(k.declarations)} accent="text-slate-700" />
      </div>
      <p className="text-xs text-slate-500">
        {periodes.length > 0 && (
          <>
            Periode(s) : <span className="font-medium">{periodes.join(', ')}</span>.{' '}
          </>
        )}
        {types && (
          <>
            Type(s) : <span className="font-medium">{types}</span>.
          </>
        )}
      </p>
    </section>
  );
}
