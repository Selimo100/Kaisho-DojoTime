import { useState, useEffect } from 'react';
import { 
  format, 
  isSameMonth, 
  isToday, 
  startOfWeek, 
  addDays
} from 'date-fns';
import type { TrainingSlot } from '../types';
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
  onDateClick: (date: Date, slots: TrainingSlot[]) => void;
  onMonthChange: (date: Date) => void;
}

export default function TrainingCalendar({
  currentDate,
  slots,
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
    const baseClasses = 'min-h-[60px] md:min-h-[80px] p-2 md:p-3 border border-white/20 relative rounded-lg transition-all';
    const daySlots = getSlotsForDate(date, slots);
    const hasTraining = daySlots.length > 0;
    const isCurrentMonth = isSameMonth(date, currentDate);
    const today = isToday(date);

    let classes = baseClasses;

    if (!isCurrentMonth) {
      classes += ' bg-kaisho-dark/20 text-white/40';
    } else if (today) {
      classes += ' bg-gradient-to-br from-kaisho-accent/30 to-purple-500/30 border-kaisho-accent/50 shadow-lg';
    } else {
      classes += ' bg-white/5';
    }

    if (hasTraining && isCurrentMonth) {
      classes += ' cursor-pointer hover:bg-white/15 hover:border-white/30 hover:shadow-md active:scale-95';
    }

    return classes;
  };

  const renderDayContent = (date: Date) => {
    const daySlots = getSlotsForDate(date, slots);
    const isCurrentMonth = isSameMonth(date, currentDate);

    return (
      <div className="h-full flex flex-col">
        <div className={`text-xs md:text-sm font-semibold mb-1 ${
          isToday(date) ? 'text-kaisho-accent' : 'text-white'
        }`}>
          {format(date, 'd')}
        </div>
        {isCurrentMonth && daySlots.length > 0 && (
          <div className="space-y-0.5 md:space-y-1 flex-1 overflow-y-auto">
            {daySlots.slice(0, isMobile ? 2 : 4).map((slot, idx) => (
              <div
                key={idx}
                className={`text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 md:py-1 rounded font-medium ${
                  slot.isExtra
                    ? 'bg-purple-500/80 text-white'
                    : 'bg-emerald-500/80 text-white'
                }`}
              >
                {slot.timeStart.slice(0, 5)}
                {slot.isExtra && ' ✨'}
              </div>
            ))}
            {daySlots.length > (isMobile ? 2 : 4) && (
              <div className="text-[10px] text-white/60">+{daySlots.length - (isMobile ? 2 : 4)}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Mobile: Wochenansicht, Desktop: Monatsansicht
  if (isMobile) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-3 shadow-xl">
        {/* Header mit Woche und Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95 text-white"
            aria-label="Vorherige Woche"
          >
            <span className="text-xl">‹</span>
          </button>
          <div className="text-center flex-1">
            <h2 className="text-base font-bold text-white">
              {formatMonthYear(currentDate)}
            </h2>
            <p className="text-xs text-white/70">Wochenansicht</p>
            <button
              onClick={() => onMonthChange(new Date())}
              className="mt-1 px-3 py-1 bg-kaisho-accent/80 hover:bg-kaisho-accent text-white text-xs font-semibold rounded-lg transition-all active:scale-95"
            >
              📅 Heute
            </button>
          </div>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95 text-white"
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
              className="text-center text-xs font-semibold text-white/80 py-1"
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
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-white/70">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500/80 rounded"></div>
            <span>Training</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-500/80 rounded"></div>
            <span>Extra ✨</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Monatsansicht
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-xl">
      {/* Header mit Monat und Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-3 hover:bg-white/10 rounded-lg transition-all active:scale-95 text-white"
          aria-label="Vorheriger Monat"
        >
          <span className="text-2xl">‹</span>
        </button>
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">
            {formatMonthYear(currentDate)}
          </h2>
          <button
            onClick={() => onMonthChange(new Date())}
            className="px-4 py-2 bg-kaisho-accent/80 hover:bg-kaisho-accent text-white text-sm font-semibold rounded-lg transition-all active:scale-95"
          >
            📅 Heute
          </button>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-3 hover:bg-white/10 rounded-lg transition-all active:scale-95 text-white"
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
            className="text-center text-sm font-bold text-white/90 py-2"
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
      <div className="mt-6 flex gap-6 text-sm text-white/80">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500/80 rounded"></div>
          <span>Reguläres Training</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500/80 rounded"></div>
          <span>Extra-Training ✨</span>
        </div>
      </div>
    </div>
  );
}
