import { useState, useEffect } from 'react';
import { 
  format, 
  isSameMonth, 
  isToday, 
  startOfWeek, 
  addDays
} from 'date-fns';
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
  
  // Get current week for mobile view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays7 = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
  
  const handlePrevWeek = () => {
    onMonthChange(addDays(currentDate, -7));
  };
  
  const handleNextWeek = () => {
    onMonthChange(addDays(currentDate, 7));
  };

  const handleDayClick = (date: Date) => {
    const daySlots = getSlotsForDate(date, slots);
    onDateClick(date, daySlots);
  };

  const getDayClasses = (date: Date): string => {
    const baseClasses = 'min-h-[60px] md:min-h-[80px] p-2 md:p-3 border border-gray-200 relative rounded-xl transition-all duration-200';
    const daySlots = getSlotsForDate(date, slots);
    const hasTraining = daySlots.length > 0;
    const isCurrentMonth = isSameMonth(date, currentDate);
    const today = isToday(date);
    
    // Check if any slot has no trainers
    const hasSlotWithNoTrainer = daySlots.some(slot => {
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
              const hasNoTrainer = slotEntries.length === 0 && !slot.isCancelled;
              
              return (
                <div
                  key={idx}
                  className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-md font-semibold flex items-center gap-1 ${
                    slot.isCancelled
                      ? 'bg-gray-500/60 text-white/60 line-through'
                      : hasNoTrainer
                      ? 'bg-red-500/80 text-white animate-pulse'
                      : slot.isExtra
                      ? 'bg-purple-500/80 text-white'
                      : 'bg-emerald-500/80 text-white'
                  }`}
                >
                  <span>{slot.timeStart.slice(0, 5)}</span>
                  {slot.isExtra && <span>✨</span>}
                  {hasNoTrainer && <span>⚠️</span>}
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

  // Mobile: Wochenansicht, Desktop: Monatsansicht
  if (isMobile) {
    return (
      <div className="bg-white rounded-2xl border border-kaisho-greyLight p-4 shadow-sm">
        {/* Header mit Woche und Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevWeek}
            className="w-10 h-10 flex items-center justify-center hover:bg-kaisho-blueIce rounded-xl transition-all active:scale-95 text-kaisho-blue"
            aria-label="Vorherige Woche"
          >
            <span className="text-xl">‹</span>
          </button>
          <div className="text-center flex-1">
            <h2 className="text-lg font-bold text-kaisho-blue tracking-tight">
              {formatMonthYear(currentDate)}
            </h2>
            <p className="text-xs text-gray-500 mb-2">Wochenansicht</p>
            <button
              onClick={() => onMonthChange(new Date())}
              className="px-4 py-1.5 bg-gradient-to-r from-kaisho-blue to-kaisho-blueLight hover:from-kaisho-blueLight hover:to-kaisho-blue text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
            >
              📅 Heute
            </button>
          </div>
          <button
            onClick={handleNextWeek}
            className="w-10 h-10 flex items-center justify-center hover:bg-kaisho-blueIce rounded-xl transition-all active:scale-95 text-kaisho-blue"
            aria-label="Nächste Woche"
          >
            <span className="text-xl">›</span>
          </button>
        </div>

        {/* Wochentage */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold text-gray-500 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Woche-Grid */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays7.map((date, index) => (
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
