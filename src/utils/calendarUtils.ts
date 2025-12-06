import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';
import { de } from 'date-fns/locale';
import type { TrainingDay, TrainingOverride, TrainingSlot } from '../types';

/**
 * Berechnet alle Trainingstage für einen bestimmten Monat
 * basierend auf den wiederkehrenden training_days und den overrides
 */
export function calculateTrainingSlotsForMonth(
  year: number,
  month: number, // 0-11 (JavaScript month)
  trainingDays: TrainingDay[],
  overrides: TrainingOverride[]
): TrainingSlot[] {
  const slots: TrainingSlot[] = [];
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const daysInMonth = eachDayOfInterval({ start, end });

  // 1. Berechne reguläre Trainingstage basierend auf training_days
  daysInMonth.forEach((date) => {
    const weekday = getDay(date); // 0 = Sonntag, 1 = Montag, ...
    const dateStr = format(date, 'yyyy-MM-dd');

    // Finde alle training_days die auf diesen Wochentag fallen
    const matchingTrainingDays = trainingDays.filter(
      (td) => td.weekday === weekday && td.is_active
    );

    matchingTrainingDays.forEach((td) => {
      // Prüfe ob es ein 'cancel' Override für dieses SPEZIFISCHE Training gibt
      // Wenn training_day_id gesetzt ist, nur dieses Training absagen
      // Wenn training_day_id NULL ist, alle Trainings an diesem Tag absagen (legacy)
      const cancelOverride = overrides.find(
        (o) => o.override_date === dateStr && 
               o.action === 'cancel' && 
               (o.training_day_id === td.id || o.training_day_id === null || o.training_day_id === undefined)
      );

      slots.push({
        date: dateStr,
        weekday,
        timeStart: td.time_start,
        timeEnd: td.time_end,
        trainingDayId: td.id,
        overrideId: cancelOverride?.id, // Override-ID für "Absage aufheben"
        isCancelled: !!cancelOverride,
        isExtra: false,
        isEvent: false,
        reason: cancelOverride?.reason || undefined,
      });
    });
  });

  // 2. Füge Extra-Trainings aus overrides hinzu
  overrides
    .filter((o) => o.action === 'extra')
    .forEach((override) => {
      const date = parseISO(override.override_date);
      if (date >= start && date <= end) {
        const isEvent = override.requires_trainers === false;
        slots.push({
          date: override.override_date,
          weekday: getDay(date),
          timeStart: override.time_start || '00:00',
          timeEnd: override.time_end || null,
          trainingDayId: -1, // Markierung für Extra-Training (nicht verwendet)
          overrideId: override.id, // Wichtig für Extra-Trainings!
          isCancelled: false,
          isExtra: true,
          isEvent: isEvent,
          reason: override.reason || undefined,
        });
      }
    });

  // Sortiere nach Datum und Zeit
  return slots.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.timeStart.localeCompare(b.timeStart);
  });
}

/**
 * Gruppiert Trainingsslots nach Datum
 */
export function groupSlotsByDate(slots: TrainingSlot[]): Map<string, TrainingSlot[]> {
  const grouped = new Map<string, TrainingSlot[]>();
  
  slots.forEach((slot) => {
    const existing = grouped.get(slot.date) || [];
    existing.push(slot);
    grouped.set(slot.date, existing);
  });
  
  return grouped;
}

/**
 * Prüft ob ein Datum ein Trainingstag ist
 */
export function isTrainingDay(date: Date, slots: TrainingSlot[]): boolean {
  const dateStr = format(date, 'yyyy-MM-dd');
  return slots.some((slot) => slot.date === dateStr && !slot.isCancelled);
}

/**
 * Hole alle Trainingsslots für ein bestimmtes Datum (inkl. abgesagte)
 */
export function getSlotsForDate(date: Date, slots: TrainingSlot[], includeCancelled: boolean = true): TrainingSlot[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  return slots.filter((slot) => slot.date === dateStr && (includeCancelled || !slot.isCancelled));
}

/**
 * Formatiere Monat und Jahr für Anzeige
 */
export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: de });
}

/**
 * Navigation Helfer
 */
export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1);
}

/**
 * Kalender-Grid-Daten für UI
 */
export function getCalendarGrid(date: Date): Date[] {
  const start = startOfMonth(date);
  const startWeekday = getDay(start);
  
  // Füge Tage vom vorherigen Monat hinzu (Montag start)
  const daysFromPrevMonth = startWeekday === 0 ? 6 : startWeekday - 1;
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - daysFromPrevMonth);
  
  // Berechne End-Datum (6 Wochen = 42 Tage)
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 41);
  
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}
