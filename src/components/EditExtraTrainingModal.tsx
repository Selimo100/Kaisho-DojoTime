import { useState } from 'react';
import { updateOverride } from '../lib/supabaseService';

interface EditExtraTrainingModalProps {
  extraTraining: {
    id: number;
    override_date: string;
    time_start: string | null;
    time_end: string | null;
    reason: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditExtraTrainingModal({
  extraTraining,
  onClose,
  onSuccess,
}: EditExtraTrainingModalProps) {
  const [overrideDate, setOverrideDate] = useState(extraTraining.override_date.split('T')[0]);
  const [timeStart, setTimeStart] = useState(extraTraining.time_start?.slice(0, 5) || '');
  const [timeEnd, setTimeEnd] = useState(extraTraining.time_end?.slice(0, 5) || '');
  const [reason, setReason] = useState(extraTraining.reason || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideDate || !timeStart) return;

    setIsLoading(true);
    try {
      await updateOverride(extraTraining.id, {
        override_date: overrideDate,
        time_start: timeStart,
        time_end: timeEnd || null,
        reason: reason || null,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating extra training:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-blue-400/30">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            ✏️ Extra-Training bearbeiten
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Datum *
            </label>
            <input
              type="date"
              value={overrideDate}
              onChange={(e) => setOverrideDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white font-medium focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Startzeit *
              </label>
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white font-medium focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Endzeit
              </label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white font-medium focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Grund / Bemerkung
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="z.B. Zusätzliches Training für Prüfungsvorbereitung"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 font-medium focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
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
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all font-bold shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Wird gespeichert...' : '💾 Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
