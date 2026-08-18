import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { createOverride } from '../lib/supabaseService';
import type { TrainingSlot } from '../types';

interface CancelTrainingModalProps {
  slot: TrainingSlot;
  date: Date;
  clubId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelTrainingModal({
  slot,
  date,
  clubId,
  onClose,
  onSuccess,
}: CancelTrainingModalProps) {
  const [reason, setReason] = useState('');
  const [cancelAllTrainings, setCancelAllTrainings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Bitte geben Sie einen Grund für die Absage an');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createOverride({
        club_id: clubId,
        training_day_id: cancelAllTrainings ? undefined : slot.trainingDayId,
        override_date: format(date, 'yyyy-MM-dd'),
        action: 'cancel',
        time_start: slot.timeStart,
        time_end: slot.timeEnd || undefined,
        reason: reason.trim(),
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error cancelling training:', err);
      setError('Fehler beim Absagen des Trainings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm md:p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
            ⚠️ Training absagen
          </h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-3xl font-bold text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 active:scale-95"
          >
            ×
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 text-sm text-gray-700">
            <strong>Datum:</strong> {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
          </div>
          <div className="text-sm text-gray-700">
            <strong>Zeit:</strong> {slot.timeStart.slice(0, 5)}
            {slot.timeEnd && ` - ${slot.timeEnd.slice(0, 5)}`}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 font-medium text-red-700 md:p-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-3">
            <legend className="block text-sm font-semibold text-gray-700">
              Was soll abgesagt werden?
            </legend>
            <div className="grid gap-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-300 bg-gray-50 p-4 transition-all hover:border-kaisho-blueLight hover:bg-kaisho-blueIce">
                <input
                  type="radio"
                  name="cancel-scope"
                  checked={!cancelAllTrainings}
                  onChange={() => setCancelAllTrainings(false)}
                  className="mt-1 h-4 w-4 border-slate-300 text-kaisho-red focus:ring-kaisho-red"
                />
                <span>
                  <span className="block font-semibold text-gray-800">
                    Nur dieses Training absagen
                  </span>
                  <span className="block text-sm text-gray-600">
                    Betrifft nur den Termin von {slot.timeStart.slice(0, 5)}
                    {slot.timeEnd && ` - ${slot.timeEnd.slice(0, 5)}`}.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-300 bg-gray-50 p-4 transition-all hover:border-kaisho-red hover:bg-red-50">
                <input
                  type="radio"
                  name="cancel-scope"
                  checked={cancelAllTrainings}
                  onChange={() => setCancelAllTrainings(true)}
                  className="mt-1 h-4 w-4 border-slate-300 text-kaisho-red focus:ring-kaisho-red"
                />
                <span>
                  <span className="block font-semibold text-gray-800">
                    Alle Trainings an diesem Tag absagen
                  </span>
                  <span className="block text-sm text-gray-600">
                    Erstellt eine Tagesabsage, sodass alle Trainings am {format(date, 'd. MMMM yyyy', { locale: de })} abgesagt sind.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Grund für die Absage *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              placeholder="z.B. Krankheit, Feiertag, Hallenausfall..."
              className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-medium text-gray-800 placeholder-gray-400 transition-all focus:border-kaisho-red focus:ring-2 focus:ring-kaisho-red"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              ⚠️ <strong>Hinweis:</strong> Nach der Absage können sich keine Trainer mehr
              {cancelAllTrainings ? ' für Trainings an diesem Tag' : ' für dieses Training'} eintragen.
              Die Absage wird im Kalender sichtbar angezeigt.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-200 active:scale-95"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-gradient-to-r from-kaisho-red to-kaisho-redLight px-4 py-3 font-bold text-white shadow-lg shadow-kaisho-red/20 transition-all hover:from-kaisho-redLight hover:to-kaisho-red active:scale-95 disabled:opacity-50"
            >
              {isLoading
                ? '⏳ Absagen...'
                : cancelAllTrainings
                ? '✓ Alle Trainings absagen'
                : '✓ Training absagen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
