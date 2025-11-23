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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-3 md:p-4">
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-red-400/30">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            ⚠️ Training absagen
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all active:scale-95"
          >
            ×
          </button>
        </div>

        <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="text-white/90 text-sm mb-2">
            <strong>Datum:</strong> {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
          </div>
          <div className="text-white/90 text-sm">
            <strong>Zeit:</strong> {slot.timeStart.slice(0, 5)}
            {slot.timeEnd && ` - ${slot.timeEnd.slice(0, 5)}`}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 md:p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Grund für die Absage *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              placeholder="z.B. Krankheit, Feiertag, Hallenausfall..."
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 font-medium focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all resize-none"
            />
          </div>

          <div className="p-3 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/50 rounded-xl">
            <p className="text-xs text-yellow-100">
              ⚠️ <strong>Hinweis:</strong> Nach der Absage können sich keine Trainer mehr für dieses 
              Training eintragen. Die Absage wird im Kalender sichtbar angezeigt.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-semibold border border-white/30 active:scale-95"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all font-bold shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isLoading ? '⏳ Absagen...' : '✓ Training absagen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
