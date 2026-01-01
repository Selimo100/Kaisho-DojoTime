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
