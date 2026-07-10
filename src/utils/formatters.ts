export const WEEKDAY_NAMES = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
] as const;

export const formatTime = (time: string | null): string => {
  if (!time) return '';
  return time.slice(0, 5); // HH:MM
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getWeekdayName = (weekday: number): string => {
  return WEEKDAY_NAMES[weekday] || '';
};

/**
 * Erzeugt anonymisierte Initialen aus einem Namen für die öffentliche Ansicht.
 * "Selina Mogicato" -> "S.M." · "Selina" -> "S."
 */
export const getInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return '?';
  return parts.map((p) => p.charAt(0).toUpperCase() + '.').join('');
};
