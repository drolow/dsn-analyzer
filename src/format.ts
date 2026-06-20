// Petits utilitaires de formatage pour l'affichage.

/** "JJMMAAAA" -> "JJ/MM/AAAA". Laisse la valeur telle quelle sinon. */
export function frDate(s?: string): string {
  if (!s) return '—';
  if (s.length === 8) return `${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4, 8)}`;
  if (s.length === 6) return `${s.slice(0, 2)}/${s.slice(2, 6)}`;
  return s;
}

const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export function euros(n: number): string {
  return eur.format(n);
}

const nf = new Intl.NumberFormat('fr-FR');
export function num(n: number): string {
  return nf.format(n);
}

/** Formate un SIREN "123456789" -> "123 456 789". */
export function siren(s?: string): string {
  if (!s) return '—';
  return s.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

export function dash(s?: string): string {
  return s && s.trim() ? s : '—';
}
