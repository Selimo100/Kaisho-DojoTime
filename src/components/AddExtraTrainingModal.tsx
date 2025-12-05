import { useState } from 'react';
import { format } from 'date-fns';
import { createOverride } from '../lib/supabaseService';

interface AddExtraTrainingModalProps {
  clubId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddExtraTrainingModal({
  clubId,
  onClose,
  onSuccess,
}: AddExtraTrainingModalProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!timeStart) {
      setError('Bitte geben Sie eine Startzeit ein');
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
        reason: reason.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating extra training:', err);
      setError('Fehler beim Erstellen des Extra-Trainings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            ✨ Extra-Training hinzufügen
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all active:scale-95"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 md:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Startzeit *
              </label>
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Endzeit
              </label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Grund / Bemerkung
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="z.B. Zusätzliches Training für Prüfungsvorbereitung"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold border border-gray-300 active:scale-95"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-kaisho-blue hover:bg-kaisho-blueDark text-white rounded-xl transition-all font-bold shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isLoading ? '⏳ Speichern...' : '✨ Hinzufügen'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-700">
            💡 <strong>Hinweis:</strong> Extra-Trainings erscheinen im Kalender mit einem ✨ Symbol
            und können von Trainern wie reguläre Trainings belegt werden.
          </p>
        </div>
      </div>
    </div>
  );
}
