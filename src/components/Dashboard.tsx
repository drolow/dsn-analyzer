import type { Analysis } from '../dsn/analyze';
import {
  contratsParNature,
  contratsParStatut,
  effectifParEtablissement,
  individusParSexe,
  individusParTrancheAge,
} from '../dsn/stats';
import { BarCard, PieCard } from './Charts';
import EntityTables from './EntityTables';
import SummaryCards from './SummaryCards';

export default function Dashboard({ analysis }: { analysis: Analysis }) {
  return (
    <div className="space-y-6">
      <SummaryCards analysis={analysis} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PieCard
          title="Repartition des contrats par nature"
          subtitle="CDI, CDD, apprentissage…"
          data={contratsParNature(analysis)}
        />
        <PieCard
          title="Repartition par sexe"
          data={individusParSexe(analysis)}
        />
        <BarCard
          title="Pyramide des ages"
          subtitle={`Ages calcules au ${analysis.ageRef.toLocaleDateString('fr-FR')}`}
          data={individusParTrancheAge(analysis)}
        />
        <PieCard
          title="Repartition cadre / non cadre"
          subtitle="Statut conventionnel des contrats"
          data={contratsParStatut(analysis)}
        />
      </div>

      <BarCard
        title="Effectif par etablissement"
        subtitle="Nombre d'individus distincts rattaches"
        data={effectifParEtablissement(analysis)}
        horizontal
      />

      <EntityTables analysis={analysis} />
    </div>
  );
}
