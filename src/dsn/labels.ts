// Libelles des rubriques DSN et decodage des principales nomenclatures.
//
// Couvre les rubriques les plus utiles a la synthese. Pour toute rubrique non
// listee, l'UI retombe sur le code brut : aucune information n'est perdue.

/** code rubrique complet (ex "S21.G00.30.005") -> libelle. */
export const FIELD_LABEL: Record<string, string> = {
  // Envoi
  'S10.G00.00.001': 'Nom du logiciel',
  'S10.G00.00.002': 'Editeur',
  'S10.G00.00.003': 'Version du logiciel',
  'S10.G00.00.006': 'Version de la norme (NEODeS)',
  'S10.G00.00.008': 'Devise',
  // Emetteur
  'S10.G00.01.001': 'SIREN emetteur',
  'S10.G00.01.002': 'NIC emetteur',
  'S10.G00.01.003': 'Raison sociale emetteur',
  'S10.G00.01.004': 'Adresse emetteur',
  'S10.G00.01.005': 'Code postal emetteur',
  'S10.G00.01.006': 'Commune emetteur',
  // Declaration
  'S20.G00.05.001': 'Nature de la declaration',
  'S20.G00.05.002': 'Type de la declaration',
  'S20.G00.05.003': "Numero d'ordre",
  'S20.G00.05.004': 'Identifiant metier',
  'S20.G00.05.005': 'Mois principal declare',
  'S20.G00.05.007': 'Date du fichier',
  'S20.G00.05.010': 'Numero de fraction',
  // Entreprise
  'S21.G00.06.001': 'SIREN',
  'S21.G00.06.002': 'NIC du siege',
  'S21.G00.06.003': 'Code APE',
  'S21.G00.06.004': 'Adresse',
  'S21.G00.06.005': 'Code postal',
  'S21.G00.06.006': 'Commune',
  // Etablissement
  'S21.G00.11.001': 'NIC',
  'S21.G00.11.002': 'Code APET',
  'S21.G00.11.003': 'Adresse',
  'S21.G00.11.004': 'Code postal',
  'S21.G00.11.005': 'Commune',
  'S21.G00.11.006': 'Complement adresse',
  'S21.G00.11.015': "Effectif de l'etablissement",
  // Individu
  'S21.G00.30.001': 'NIR',
  'S21.G00.30.002': 'Nom de famille',
  'S21.G00.30.003': "Nom d'usage",
  'S21.G00.30.004': 'Prenoms',
  'S21.G00.30.005': 'Sexe',
  'S21.G00.30.006': 'Date de naissance',
  'S21.G00.30.007': 'Lieu de naissance',
  'S21.G00.30.008': 'Adresse',
  'S21.G00.30.009': 'Code postal',
  'S21.G00.30.010': 'Commune',
  'S21.G00.30.019': 'Matricule',
  'S21.G00.30.020': 'Numero technique temporaire (NTT)',
  // Contrat
  'S21.G00.40.001': 'Date de debut du contrat',
  'S21.G00.40.002': 'Statut du salarie (conventionnel)',
  'S21.G00.40.003': 'Statut categoriel Retraite Complementaire',
  'S21.G00.40.004': 'Code profession (PCS-ESE)',
  'S21.G00.40.005': 'Complement PCS-ESE',
  'S21.G00.40.006': "Libelle de l'emploi",
  'S21.G00.40.007': 'Nature du contrat',
  'S21.G00.40.008': 'Dispositif de politique publique',
  'S21.G00.40.009': 'Numero du contrat',
  'S21.G00.40.010': 'Date de fin previsionnelle (CDD)',
  'S21.G00.40.011': 'Unite de mesure de la quotite',
  'S21.G00.40.012': "Quotite de travail de reference de l'entreprise",
  'S21.G00.40.013': 'Quotite de travail du contrat',
  'S21.G00.40.014': 'Modalite temps de travail',
  'S21.G00.40.017': 'Convention collective (IDCC)',
  // Versement / remuneration
  'S21.G00.50.001': 'Date de versement',
  'S21.G00.50.002': 'Remuneration nette fiscale',
  'S21.G00.50.003': 'Numero de versement',
  'S21.G00.51.001': 'Date de debut de periode de paie',
  'S21.G00.51.002': 'Date de fin de periode de paie',
  'S21.G00.51.003': 'Numero du contrat',
  'S21.G00.51.011': 'Type de remuneration',
  'S21.G00.51.012': 'Nombre d\'heures',
  'S21.G00.51.013': 'Montant',
  // Fin de contrat
  'S21.G00.62.001': 'Date de fin du contrat',
  'S21.G00.62.002': 'Motif de rupture',
};

export function fieldLabel(fullCode: string): string {
  return FIELD_LABEL[fullCode] ?? fullCode;
}

// --- Nomenclatures ---

/** Sexe (S21.G00.30.005). */
export const SEXE: Record<string, string> = {
  '01': 'Homme',
  '02': 'Femme',
};

/** Nature du contrat (S21.G00.40.007). Principales valeurs. */
export const NATURE_CONTRAT: Record<string, string> = {
  '01': 'CDI',
  '02': 'CDD',
  '03': 'Interim',
  '07': 'CDI intermittent',
  '08': 'CDD intermittent',
  '09': 'Contrat de travail temporaire',
  '10': 'Apprentissage',
  '20': "Contrat d'appui projet entreprise",
  '21': 'Contrat de mission (interim)',
  '29': "Convention de stage",
  '32': 'Contrat de professionnalisation',
  '50': 'Mandat social',
  '60': 'Contrat de soutien et d\'aide par le travail',
  '70': 'Mandat (elu)',
  '80': 'Volontariat',
  '81': 'Autre nature de contrat (stage, formation)',
  '82': 'Convention de stage (etudiant en milieu professionnel)',
  '90': 'Autre nature de contrat',
  '91': 'Ligne de service (marins)',
  '92': 'Engagement maritime a duree determinee',
  '93': 'Engagement maritime a duree indeterminee',
};

/**
 * Statut du salarie (conventionnel) - S21.G00.40.002.
 * Categorie socio-professionnelle au sens de la convention collective.
 */
export const STATUT_SALARIE: Record<string, string> = {
  '03': 'Cadre dirigeant',
  '04': 'Autre cadre (CCN)',
  '05': 'Profession intermediaire',
  '06': 'Employe',
  '07': 'Ouvrier',
  '08': "Agent de la fonction publique d'Etat",
  '09': 'Agent de la fonction publique hospitaliere',
  '10': 'Agent de la fonction publique territoriale',
};

/**
 * Code statut categoriel Retraite Complementaire (AGIRC-ARRCO) -
 * S21.G00.40.003. C'est ce code qui distingue cadre / non cadre.
 */
export const STATUT_CATEGORIEL_RC: Record<string, string> = {
  '01': 'Cadre (art. 4 et 4 bis)',
  '02': 'Assimile cadre (extension)',
  '03': 'Cadre (autre)',
  '04': 'Non cadre',
};

/** Nature de la declaration (S20.G00.05.001). */
export const NATURE_DECLARATION: Record<string, string> = {
  '01': 'DSN mensuelle',
  '02': 'Signalement - arret de travail',
  '03': 'Signalement - fin du contrat',
  '04': 'Signalement - reprise',
  '05': 'Signalement - amorcage des donnees',
  '06': 'Signalement - fin du contrat unique',
};

/** Type de la declaration (S20.G00.05.002). */
export const TYPE_DECLARATION: Record<string, string> = {
  '01': 'Declaration normale',
  '02': 'Declaration annule et remplace',
  '03': 'Declaration annulee',
  '04': 'Declaration neant',
  '05': 'Declaration normale (test)',
};

/** Decode une valeur via une nomenclature, en gardant le code en suffixe. */
export function decode(map: Record<string, string>, value?: string): string {
  if (!value) return '—';
  const label = map[value];
  return label ? `${label} (${value})` : value;
}
