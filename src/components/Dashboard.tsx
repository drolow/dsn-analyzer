import type { Analysis } from '../dsn/analyze';
import {
  contratsParCategorieCadre,
  contratsParNature,
  contratsParStatutSalarie,
  effectifParEtablissement,
  individusParSexe,
  individusParTrancheAge,
  repartitionTempsTravail,
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
          subtitle="Statut categoriel Retraite Complementaire (S21.G00.40.003)"
          data={contratsParCategorieCadre(analysis)}
        />
        <PieCard
          title="Temps plein / temps partiel"
          subtitle="Quotite du contrat vs quotite de reference"
          data={repartitionTempsTravail(analysis)}
        />
        <BarCard
          title="Categorie socio-professionnelle"
          subtitle="Statut du salarie conventionnel (S21.G00.40.002)"
          data={contratsParStatutSalarie(analysis)}
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
