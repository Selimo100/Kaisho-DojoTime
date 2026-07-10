import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TrainingSlot, TrainingEntry } from '../types';
import { getInitials } from '../utils/formatters';

interface PublicDayModalProps {
  date: Date;
  slots: TrainingSlot[];
  entries: TrainingEntry[];
  onClose: () => void;
}

/**
 * Schreibgeschützte Tages-Detailansicht für die öffentliche Ansicht.
 * Zeigt die Trainings eines Tages inkl. anonymisierter Coach-Initialen.
 */
export default function PublicDayModal({ date, slots, entries, onClose }: PublicDayModalProps) {
  // Nur Trainings anzeigen (Events haben eine eigene Info-Ansicht)
  const trainingSlots = slots.filter((s) => !s.isEvent);

  const getInitialsForSlot = (slot: TrainingSlot): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    entries.forEach((e) => {
      if (e.training_date !== slot.date) return;
      const matches = slot.isExtra
        ? e.override_id === slot.overrideId
        : e.training_day_id === slot.trainingDayId;
      if (!matches) return;
      const ini = getInitials(e.trainer_name || '');
      if (!seen.has(ini)) {
        seen.add(ini);
        result.push(ini);
      }
    });
    return result;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-kaisho-blue to-kaisho-blueLight p-6 flex justify-between items-center rounded-t-2xl sticky top-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Trainings</h2>
            <p className="text-white/90 text-sm mt-1">
              {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
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
        <div className="p-6 space-y-3">
          {trainingSlots.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Kein Training an diesem Tag.</p>
          ) : (
            trainingSlots.map((slot, idx) => {
              const initials = getInitialsForSlot(slot);
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 ${
                    slot.isCancelled
                      ? 'border-gray-200 bg-gray-50'
                      : slot.isExtra
                      ? 'border-purple-200 bg-purple-50'
                      : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div
                        className={`text-lg font-bold text-gray-800 ${
                          slot.isCancelled ? 'line-through text-gray-400' : ''
                        }`}
                      >
                        {slot.timeStart.slice(0, 5)}
                        {slot.timeEnd && (
                          <span className="font-normal text-gray-500"> – {slot.timeEnd.slice(0, 5)}</span>
                        )}
                      </div>
                      {slot.name && <div className="text-sm text-gray-600 font-medium">{slot.name}</div>}
                    </div>
                    {slot.isCancelled && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                        Abgesagt ❌
                      </span>
                    )}
                    {slot.isExtra && !slot.isCancelled && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        Extra ✨
                      </span>
                    )}
                  </div>

                  {!slot.isCancelled && (
                    <div className="mt-3 pt-3 border-t border-black/5">
                      <div className="text-xs font-semibold text-gray-500 mb-1.5">COACHES</div>
                      {initials.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {initials.map((ini, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded-full bg-white border border-gray-200 text-sm font-bold text-kaisho-blue shadow-sm"
                            >
                              {ini}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">Noch offen</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-kaisho-blue hover:bg-kaisho-blueLight text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
