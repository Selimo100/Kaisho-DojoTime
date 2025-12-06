import { useState } from 'react';
import { format } from 'date-fns';
import { createOverride } from '../lib/supabaseService';

interface QuickEventModalProps {
  clubId: string;
  date: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickEventModal({
  clubId,
  date: initialDate,
  onClose,
  onSuccess,
}: QuickEventModalProps) {
  const [selectedDate, setSelectedDate] = useState(format(initialDate, 'yyyy-MM-dd'));
  const [timeStart, setTimeStart] = useState('18:00');
  const [timeEnd, setTimeEnd] = useState('19:30');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !timeStart || !reason.trim()) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createOverride({
        club_id: clubId,
        override_date: selectedDate,
        action: 'extra',
        time_start: timeStart,
        time_end: timeEnd || undefined,
        reason: reason.trim(),
        requires_trainers: false,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating special training:', err);
      setError('Fehler beim Erstellen des Events. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-400 to-sky-500 p-5 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📅</span>
              <span>Event erstellen</span>
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Erstelle ein einmaliges Event
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-all text-2xl font-bold w-10 h-10 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Datum *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Event Name/Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event-Name / Beschreibung *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="z.B. Prüfungstraining, Workshop, Sondertraining"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start *
              </label>
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ende
              </label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
            <p className="text-sm text-sky-800">
              <span className="font-bold">💡 Hinweis:</span> Events werden im Kalender als Info angezeigt (hellblau). Sie sind unabhängig von Trainings und benötigen keine Trainer-Anmeldungen.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                  Erstelle...
                </span>
              ) : (
                '📅 Event erstellen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
