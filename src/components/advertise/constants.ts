export const placementLabels: Record<string, { label: string; desc: string }> = {
  compact: { label: 'Bandeau compact', desc: 'Petit format discret intégré aux listes' },
  native: { label: 'Natif (flux)', desc: 'Intégré naturellement dans le contenu' },
  sponsored_card: { label: 'Carte sponsorisée', desc: 'Format visuel large avec image' },
};

export const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  approved: { label: 'Active', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  rejected: { label: 'Refusée', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  paused: { label: 'En pause', color: 'bg-muted text-muted-foreground border-border' },
};
