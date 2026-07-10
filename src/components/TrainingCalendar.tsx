import { useState, useEffect } from 'react';
import {
  format,
  isSameMonth,
  isToday,
  isPast,
  parseISO
} from 'date-fns';
import { de } from 'date-fns/locale';
import type { TrainingSlot, TrainingEntry } from '../types';
import {
  getCalendarGrid,
  formatMonthYear,
  getNextMonth,
  getPreviousMonth,
  getSlotsForDate,
} from '../utils/calendarUtils';

interface TrainingCalendarProps {
  currentDate: Date;
  slots: TrainingSlot[];
  entries?: TrainingEntry[];
  onDateClick: (date: Date, slots: TrainingSlot[]) => void;
  onMonthChange: (date: Date) => void;
}

export default function TrainingCalendar({
  currentDate,
  slots,
  entries = [],
  onDateClick,
  onMonthChange,
}: TrainingCalendarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const calendarDays = getCalendarGrid(currentDate);
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper function to check if a slot has trainers
  const getEntriesForSlot = (slot: TrainingSlot) => {
    return entries.filter(entry => {
      if (entry.training_date !== slot.date) return false;
      if (slot.isExtra) {
        return entry.override_id === slot.overrideId;
      } else {
        return entry.training_day_id === slot.trainingDayId;
      }
    });
  };

  const handlePrevMonth = () => {
    onMonthChange(getPreviousMonth(currentDate));
  };

  const handleNextMonth = () => {
    onMonthChange(getNextMonth(currentDate));
  };

  const handleDayClick = (date: Date) => {
    const daySlots = getSlotsForDate(date, slots);
    // Events und Trainings sind beide klickbar - ClubPage entscheidet welches Modal
    if (daySlots.length > 0) {
      onDateClick(date, daySlots);
    }
  };

  const getDayClasses = (date: Date): string => {
    const baseClasses = 'min-h-[60px] md:min-h-[80px] p-2 md:p-3 border border-gray-200 relative rounded-xl transition-all duration-200';
    const daySlots = getSlotsForDate(date, slots);
    const hasTraining = daySlots.length > 0;
    const isCurrentMonth = isSameMonth(date, currentDate);
    const today = isToday(date);
    
    // Check if any slot has no trainers (ignore events)
    const hasSlotWithNoTrainer = daySlots.some(slot => {
      if (slot.isEvent) return false;
      const slotEntries = getEntriesForSlot(slot);
      return slotEntries.length === 0 && !slot.isCancelled;
    });

    let classes = baseClasses;

    if (!isCurrentMonth) {
      classes += ' bg-gray-50 text-gray-300';
    } else if (today) {
      classes += ' bg-kaisho-blueIce border-kaisho-blueLight shadow-md ring-2 ring-kaisho-blueLight/30';
    } else if (hasSlotWithNoTrainer) {
      classes += ' bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-400/40';
    } else {
      classes += ' bg-white hover:bg-kaisho-blueIce/50';
    }

    if (hasTraining && isCurrentMonth) {
      classes += ' cursor-pointer hover:border-kaisho-blueLight hover:shadow-md active:scale-[0.98]';
    }

    return classes;
  };

  const renderDayContent = (date: Date) => {
    const daySlots = getSlotsForDate(date, slots);
    const isCurrentMonth = isSameMonth(date, currentDate);

    return (
      <div className="h-full flex flex-col">
        <div className={`text-xs md:text-sm font-bold mb-1 ${
          isToday(date) ? 'text-kaisho-blue' : 'text-gray-700'
        }`}>
          {format(date, 'd')}
        </div>
        {isCurrentMonth && daySlots.length > 0 && (
          <div className="space-y-0.5 md:space-y-1 flex-1 overflow-y-auto">
            {daySlots.slice(0, isMobile ? 2 : 4).map((slot, idx) => {
              const slotEntries = getEntriesForSlot(slot);
              const hasNoTrainer = slotEntries.length === 0 && !slot.isCancelled && !slot.isEvent;
              
              return (
                <div
                  key={idx}
                  className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-md font-semibold flex items-center gap-1 ${
                    slot.isCancelled
                      ? 'bg-gray-500/60 text-white/60 line-through'
                      : slot.isEvent
                      ? 'bg-sky-400/80 text-white'
                      : hasNoTrainer
                      ? 'bg-red-500/80 text-white animate-pulse'
                      : slot.isExtra
                      ? 'bg-purple-500/80 text-white'
                      : 'bg-emerald-500/80 text-white'
                  }`}
                >
                  <span>{slot.timeStart.slice(0, 5)}</span>
                  {slot.name && (
                    <span className="truncate max-w-[70px] font-medium opacity-90">{slot.name}</span>
                  )}
                  {slot.isEvent && <span>📅</span>}
                  {slot.isExtra && !slot.isEvent && <span>✨</span>}
                  {hasNoTrainer && <span>⚠️</span>}
                  {!slot.isCancelled && !slot.isEvent && !hasNoTrainer && (
                    <span className="ml-1 bg-black/15 px-1 rounded-sm text-[9px] min-w-[12px] text-center inline-block">
                      {slotEntries.length}
                    </span>
                  )}
                  {slot.isCancelled && <span className="no-underline">❌</span>}
                </div>
              );
            })}
            {daySlots.length > (isMobile ? 2 : 4) && (
              <div className="text-[10px] text-white/50 font-medium">+{daySlots.length - (isMobile ? 2 : 4)} mehr</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Beschreibt Farbe, Label und Icon eines Slots für die Agenda-Ansicht
  const getSlotMeta = (slot: TrainingSlot) => {
    const slotEntries = getEntriesForSlot(slot);
    if (slot.isCancelled) {
      return { accent: 'bg-gray-400', pill: 'bg-gray-100 text-gray-500', label: 'Abgesagt', icon: '❌' };
    }
    if (slot.isEvent) {
      return { accent: 'bg-sky-400', pill: 'bg-sky-100 text-sky-700', label: 'Event', icon: '📅' };
    }
    if (slotEntries.length === 0) {
      return { accent: 'bg-red-500', pill: 'bg-red-100 text-red-700', label: 'Kein Trainer', icon: '⚠️' };
    }
    if (slot.isExtra) {
      return {
        accent: 'bg-purple-500',
        pill: 'bg-purple-100 text-purple-700',
        label: `${slotEntries.length} Trainer`,
        icon: '✨',
      };
    }
    return {
      accent: 'bg-emerald-500',
      pill: 'bg-emerald-100 text-emerald-700',
      label: `${slotEntries.length} Trainer`,
      icon: '✓',
    };
  };

  // Mobile: Agenda-Ansicht (ganzer Monat, chronologisch, keine übersprungenen Trainings)
  if (isMobile) {
    // Alle Trainings des aktuellen Monats nach Datum gruppieren
    const monthSlots = slots
      .filter((s) => isSameMonth(parseISO(s.date), currentDate))
      .sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        return d !== 0 ? d : a.timeStart.localeCompare(b.timeStart);
      });

    const byDate = new Map<string, TrainingSlot[]>();
    monthSlots.forEach((s) => {
      const list = byDate.get(s.date) || [];
      list.push(s);
      byDate.set(s.date, list);
    });
    const dateKeys = Array.from(byDate.keys());

    return (
      <div className="bg-white rounded-2xl border border-kaisho-greyLight p-4 shadow-sm">
        {/* Header mit Monatsnavigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 flex items-center justify-center hover:bg-kaisho-blueIce rounded-xl transition-all active:scale-95 text-kaisho-blue"
            aria-label="Vorheriger Monat"
          >
            <span className="text-xl">‹</span>
          </button>
          <div className="text-center flex-1">
            <h2 className="text-lg font-bold text-kaisho-blue tracking-tight">
              {formatMonthYear(currentDate)}
            </h2>
            <button
              onClick={() => onMonthChange(new Date())}
              className="mt-1 px-4 py-1.5 bg-gradient-to-r from-kaisho-blue to-kaisho-blueLight hover:from-kaisho-blueLight hover:to-kaisho-blue text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
            >
              📅 Heute
            </button>
          </div>
          <button
            onClick={handleNextMonth}
            className="w-10 h-10 flex items-center justify-center hover:bg-kaisho-blueIce rounded-xl transition-all active:scale-95 text-kaisho-blue"
            aria-label="Nächster Monat"
          >
            <span className="text-xl">›</span>
          </button>
        </div>

        {/* Agenda-Liste */}
        {dateKeys.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">🗓️</div>
            <p className="text-gray-500 font-medium">Keine Trainings in diesem Monat</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dateKeys.map((dateStr) => {
              const date = parseISO(dateStr);
              const daySlots = byDate.get(dateStr)!;
              const today = isToday(date);
              const past = isPast(date) && !today;

              return (
                <div
                  key={dateStr}
                  className={`flex gap-3 rounded-2xl border p-3 transition-all ${
                    today
                      ? 'border-kaisho-blueLight bg-kaisho-blueIce/60 ring-1 ring-kaisho-blueLight/40'
                      : 'border-gray-100 bg-white'
                  } ${past ? 'opacity-60' : ''}`}
                >
                  {/* Datums-Badge */}
                  <div
                    className={`flex flex-col items-center justify-center w-14 flex-shrink-0 rounded-xl py-2 ${
                      today ? 'bg-kaisho-blue text-white' : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      {format(date, 'EEE', { locale: de })}
                    </span>
                    <span className="text-xl font-bold leading-tight">{format(date, 'd')}</span>
                  </div>

                  {/* Trainings des Tages */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {daySlots.map((slot, idx) => {
                      const meta = getSlotMeta(slot);
                      return (
                        <button
                          key={idx}
                          onClick={() => handleDayClick(date)}
                          className="w-full flex items-center gap-2.5 text-left rounded-xl bg-gray-50 hover:bg-kaisho-blueIce/70 active:scale-[0.99] transition-all p-2.5"
                        >
                          <div className={`w-1 self-stretch rounded-full ${meta.accent}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold text-sm text-gray-800 ${slot.isCancelled ? 'line-through text-gray-400' : ''}`}>
                              {slot.timeStart.slice(0, 5)}
                              {slot.timeEnd && (
                                <span className="font-normal text-gray-500"> – {slot.timeEnd.slice(0, 5)}</span>
                              )}
                            </div>
                            {slot.name && (
                              <div className="text-xs text-gray-600 font-medium truncate">{slot.name}</div>
                            )}
                          </div>
                          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${meta.pill}`}>
                            <span>{meta.icon}</span>
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legende */}
        <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-emerald-500/80 rounded-sm"></div>
            <span>Training</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-purple-500/80 rounded-sm"></div>
            <span>Extra ✨</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-red-500/80 rounded-sm"></div>
            <span>Kein Trainer ⚠️</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Monatsansicht
  return (
    <div className="bg-white rounded-2xl border border-kaisho-greyLight p-6 shadow-sm">
      {/* Header mit Monat und Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="w-12 h-12 flex items-center justify-center hover:bg-kaisho-blueIce rounded-xl transition-all active:scale-95 text-kaisho-blue"
          aria-label="Vorheriger Monat"
        >
          <span className="text-2xl">‹</span>
        </button>
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-kaisho-blue mb-3 tracking-tight">
            {formatMonthYear(currentDate)}
          </h2>
          <button
            onClick={() => onMonthChange(new Date())}
            className="px-5 py-2 bg-gradient-to-r from-kaisho-blue to-kaisho-blueLight hover:from-kaisho-blueLight hover:to-kaisho-blue text-white text-sm font-semibold rounded-lg transition-all active:scale-95 shadow-md"
          >
            📅 Heute
          </button>
        </div>
        <button
          onClick={handleNextMonth}
          className="w-12 h-12 flex items-center justify-center hover:bg-kaisho-blueIce rounded-xl transition-all active:scale-95 text-kaisho-blue"
          aria-label="Nächster Monat"
        >
          <span className="text-2xl">›</span>
        </button>
      </div>

      {/* Wochentage */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-bold text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Kalender-Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => (
          <div
            key={index}
            className={getDayClasses(date)}
            onClick={() => handleDayClick(date)}
          >
            {renderDayContent(date)}
          </div>
        ))}
      </div>

      {/* Legende */}
      <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500/80 rounded"></div>
          <span>Trainer eingetragen</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500/80 rounded"></div>
          <span>Extra-Training ✨</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500/80 rounded"></div>
          <span>Kein Trainer ⚠️</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500/60 rounded"></div>
          <span>Abgesagt</span>
        </div>
      </div>
    </div>
  );
}
