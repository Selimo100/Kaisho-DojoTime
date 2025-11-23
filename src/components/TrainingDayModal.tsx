import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TrainingSlot, TrainingEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { createTrainingEntry } from '../lib/supabaseService';
import CancelTrainingModal from './CancelTrainingModal';

interface TrainingDayModalProps {
  date: Date;
  slots: TrainingSlot[];
  entries: TrainingEntry[];
  clubId: string;
  isAdmin: boolean;
  onClose: () => void;
  onEntryAdded: () => void;
  onAuthRequired: () => void;
}

export default function TrainingDayModal({
  date,
  slots,
  entries,
  clubId,
  isAdmin,
  onClose,
  onEntryAdded,
  onAuthRequired,
}: TrainingDayModalProps) {
  const { trainer, isAuthenticated } = useAuth();
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(
    slots.length === 1 && !slots[0].isCancelled ? slots[0].trainingDayId : null
  );
  const [remark, setRemark] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [slotToCancel, setSlotToCancel] = useState<TrainingSlot | null>(null);

  const handleCancelClick = (slot: TrainingSlot) => {
    setSlotToCancel(slot);
    setShowCancelModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainer || !selectedSlotId || isLoading) return;

    // Prüfe ob bereits eingetragen
    const alreadyEntered = dateEntries.some(
      entry => entry.trainer_id === trainer.id && entry.training_day_id === selectedSlotId
    );
    
    if (alreadyEntered) {
      alert('Sie haben sich für dieses Training bereits eingetragen!');
      return;
    }

    setIsLoading(true);
    try {
      await createTrainingEntry({
        club_id: clubId,
        training_day_id: selectedSlotId,
        training_date: format(date, 'yyyy-MM-dd'),
        trainer_id: trainer.id,
        trainer_name: trainer.name,
        remark: remark.trim() || undefined,
      });

      setRemark('');
      onEntryAdded();
    } catch (error: any) {
      console.error('Error creating entry:', error);
      
      // Spezifische Fehlermeldung für Duplikat
      if (error?.code === '23505' || error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
        alert('Sie haben sich bereits für dieses Training eingetragen!');
      } else {
        alert('Fehler beim Speichern des Eintrags. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filtere Einträge für das gewählte Datum
  const dateStr = format(date, 'yyyy-MM-dd');
  const dateEntries = entries.filter((e) => e.training_date === dateStr);

  const handleEntryClick = () => {
    if (!isAuthenticated) {
      onAuthRequired();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-gradient-to-br from-kaisho-dark via-kaisho-primary to-kaisho-secondary rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="sticky top-0 bg-kaisho-dark/95 backdrop-blur-md border-b border-white/20 p-4 md:p-5 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg md:text-xl font-bold text-white">
            {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all active:scale-95"
          >
            ×
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Trainingszeiten */}
          <div>
            <h3 className="font-bold text-white mb-3 text-base md:text-lg">Trainingszeiten:</h3>
            <div className="space-y-2">
              {slots.map((slot, idx) => {
                const isAlreadyEntered = trainer && dateEntries.some(
                  entry => entry.trainer_id === trainer.id && entry.training_day_id === slot.trainingDayId
                );
                
                return (
                  <div
                    key={idx}
                    className={`p-3 md:p-4 rounded-xl border-2 ${
                      slot.isCancelled
                        ? 'border-gray-500/50 bg-gray-700/40 backdrop-blur-sm opacity-60'
                        : isAlreadyEntered
                        ? 'border-green-400/70 bg-green-500/30 backdrop-blur-sm'
                        : slot.isExtra
                        ? 'border-purple-400/50 bg-purple-500/20 backdrop-blur-sm'
                        : 'border-emerald-400/50 bg-emerald-500/20 backdrop-blur-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-base md:text-lg ${
                            slot.isCancelled ? 'text-white/60 line-through' : 'text-white'
                          }`}>
                            {slot.timeStart.slice(0, 5)}
                            {slot.timeEnd && ` - ${slot.timeEnd.slice(0, 5)}`}
                          </span>
                          {slot.isCancelled && (
                            <span className="text-xs md:text-sm text-red-300 font-bold bg-red-500/30 px-2 py-1 rounded">
                              ❌ ABGESAGT
                            </span>
                          )}
                          {isAlreadyEntered && !slot.isCancelled && (
                            <span className="text-xs md:text-sm text-green-200 font-bold bg-green-500/40 px-2 py-1 rounded">
                              ✓ EINGETRAGEN
                            </span>
                          )}
                          {slot.isExtra && !slot.isCancelled && !isAlreadyEntered && (
                            <span className="text-xs md:text-sm text-purple-200 font-semibold">
                              ✨ Extra-Training
                            </span>
                          )}
                        </div>
                        {slot.reason && (
                          <p className={`text-sm mt-1 ${
                            slot.isCancelled ? 'text-white/60 italic' : 'text-white/80'
                          }`}>
                            {slot.isCancelled && '🔒 '}{slot.reason}
                          </p>
                        )}
                      </div>
                      {isAdmin && !slot.isExtra && !slot.isCancelled && (
                        <button
                          onClick={() => handleCancelClick(slot)}
                          className="px-3 md:px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 shadow-lg"
                        >
                          Absagen
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bestehende Einträge - Nur für eingeloggte User */}
          {isAuthenticated && dateEntries.length > 0 && (
            <div>
              <h3 className="font-bold text-white mb-3 text-base md:text-lg">
                Eingetragene Trainer ({dateEntries.length}):
              </h3>
              <div className="space-y-2">
                {dateEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/10 backdrop-blur-sm p-3 md:p-4 rounded-xl border border-white/20"
                  >
                    <div className="font-semibold text-white text-base">{entry.trainer_name}</div>
                    {entry.remark && (
                      <p className="text-sm text-white/80 mt-1">{entry.remark}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datenschutz-Hinweis für nicht eingeloggte User */}
          {!isAuthenticated && (
            <div className="p-4 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/50 rounded-xl">
              <p className="text-sm text-yellow-100 font-medium">
                🔒 Aus Datenschutzgründen sind Trainer-Einträge nur nach dem Login sichtbar.
                Bitte melden Sie sich an, um zu sehen, wer bereits eingetragen ist.
              </p>
            </div>
          )}

          {/* Eintragen-Formular */}
          {isAuthenticated ? (
            <div className="border-t border-white/20 pt-4 md:pt-6">
              <h3 className="font-bold text-white mb-4 text-base md:text-lg">Als Trainer eintragen:</h3>
              
              {/* Check if all slots are cancelled */}
              {slots.every(slot => slot.isCancelled) ? (
                <div className="p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-xl text-center">
                  <p className="text-red-100 font-semibold">
                    ❌ Alle Trainings an diesem Tag wurden abgesagt.
                  </p>
                  <p className="text-red-200/80 text-sm mt-2">
                    Es können keine Einträge vorgenommen werden.
                  </p>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {slots.filter(s => !s.isCancelled).length > 1 && (
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Trainingszeit wählen *
                    </label>
                    <select
                      value={selectedSlotId || ''}
                      onChange={(e) => setSelectedSlotId(Number(e.target.value))}
                      required
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:ring-2 focus:ring-kaisho-accent focus:border-kaisho-accent transition-all"
                    >
                      <option value="">Bitte wählen...</option>
                      {slots.map((slot, idx) => (
                        <option key={idx} value={slot.trainingDayId} disabled={slot.isCancelled}>
                          {slot.timeStart.slice(0, 5)}
                          {slot.timeEnd && ` - ${slot.timeEnd.slice(0, 5)}`}
                          {slot.isExtra && ' (Extra)'}
                          {slot.isCancelled && ' [ABGESAGT]'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Trainer
                  </label>
                  <input
                    type="text"
                    value={trainer?.name || ''}
                    disabled
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white/70 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Bemerkung (optional)
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="z.B. Vertretung, besondere Themen..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-kaisho-accent focus:border-kaisho-accent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !selectedSlotId}
                  className="w-full py-3 md:py-4 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all font-bold text-base md:text-lg shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Speichern...' : '✓ Eintragen'}
                </button>
              </form>
              )}
            </div>
          ) : (
            <div className="border-t border-white/20 pt-4 md:pt-6">
              <button
                onClick={handleEntryClick}
                className="w-full py-4 px-4 bg-gradient-to-r from-kaisho-accent to-red-600 hover:from-red-600 hover:to-kaisho-accent text-white rounded-xl transition-all font-bold text-base md:text-lg shadow-lg active:scale-95"
              >
                🔐 Anmelden um sich einzutragen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Training Modal */}
      {showCancelModal && slotToCancel && (
        <CancelTrainingModal
          slot={slotToCancel}
          date={date}
          clubId={clubId}
          onClose={() => {
            setShowCancelModal(false);
            setSlotToCancel(null);
          }}
          onSuccess={() => {
            onEntryAdded(); // Refresh data
            onClose(); // Close main modal
          }}
        />
      )}
    </div>
  );
}
