import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TrainingSlot, TrainingEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { createTrainingEntry, deleteTrainingEntry, deleteOverride, cancelScheduledTrainer } from '../lib/supabaseService';
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
  const [selectedSlot, setSelectedSlot] = useState<TrainingSlot | null>(null);
  const [remark, setRemark] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUncancelling, setIsUncancelling] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [slotToCancel, setSlotToCancel] = useState<TrainingSlot | null>(null);

  const handleCancelClick = (slot: TrainingSlot) => {
    setSlotToCancel(slot);
    setShowCancelModal(true);
  };

  const handleUncancelClick = async (slot: TrainingSlot) => {
    if (!slot.overrideId) {
      console.error('No overrideId found for cancelled slot');
      return;
    }
    
    setIsUncancelling(slot.trainingDayId);
    try {
      await deleteOverride(slot.overrideId);
      onEntryAdded(); // Refresh data
      onClose(); // Modal schliessen nach erfolgreicher Aktion
    } catch (error) {
      console.error('Error uncancelling training:', error);
    } finally {
      setIsUncancelling(null);
    }
  };

  // Filtere Einträge für das gewählte Datum
  const dateStr = format(date, 'yyyy-MM-dd');
  const dateEntries = entries.filter((e) => e.training_date === dateStr);

  // Debug: Log entries und slots zum Debuggen
  console.log('TrainingDayModal Debug:', {
    dateStr,
    dateEntries: dateEntries.map(e => ({ 
      id: e.id, 
      trainer_id: e.trainer_id, 
      trainer_name: e.trainer_name,
      training_day_id: e.training_day_id, 
      override_id: e.override_id 
    })),
    slots: slots.map(s => ({ 
      trainingDayId: s.trainingDayId, 
      overrideId: s.overrideId, 
      isExtra: s.isExtra,
      timeStart: s.timeStart
    })),
    trainerId: trainer?.id
  });

  // Prüfe ob Trainer bereits für einen Slot eingetragen ist
  const getTrainerEntryForSlot = (slot: TrainingSlot) => {
    if (!trainer) return null;
    return dateEntries.find(entry => {
      if (slot.isExtra && slot.overrideId) {
        // Für Extra-Trainings: Vergleiche override_id
        const match = entry.trainer_id === trainer.id && 
                      entry.override_id !== null && 
                      entry.override_id === slot.overrideId;
        return match;
      } else {
        // Für reguläre Trainings: Vergleiche training_day_id
        const match = entry.trainer_id === trainer.id && 
                      entry.training_day_id !== null && 
                      entry.training_day_id === slot.trainingDayId;
        return match;
      }
    });
  };

  // Zähle Einträge pro Slot
  const getEntriesForSlot = (slot: TrainingSlot) => {
    return dateEntries.filter(entry => {
      if (slot.isExtra && slot.overrideId) {
        // Für Extra-Trainings: Vergleiche override_id
        return entry.override_id !== null && entry.override_id === slot.overrideId;
      } else {
        // Für reguläre Trainings: Vergleiche training_day_id
        return entry.training_day_id !== null && entry.training_day_id === slot.trainingDayId;
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainer || !selectedSlot || isLoading) return;

    setSubmitError(null);

    // Prüfe ob bereits eingetragen
    const alreadyEntered = getTrainerEntryForSlot(selectedSlot);
    
    if (alreadyEntered) {
      setSubmitError('Du bist bereits für dieses Training eingetragen!');
      return;
    }

    setIsLoading(true);
    try {
      await createTrainingEntry({
        club_id: clubId,
        training_day_id: selectedSlot.isExtra ? null : selectedSlot.trainingDayId,
        override_id: selectedSlot.isExtra ? selectedSlot.overrideId : undefined,
        training_date: format(date, 'yyyy-MM-dd'),
        trainer_id: trainer.id,
        trainer_name: trainer.name,
        remark: remark.trim() || undefined,
      });

      setRemark('');
      setSelectedSlot(null);
      onEntryAdded();
    } catch (error: any) {
      console.error('Error creating entry:', error);
      // Prüfe ob es ein Duplicate Key Error ist
      if (error?.code === '23505') {
        setSubmitError('Du bist bereits für dieses Training eingetragen! Bitte lade die Seite neu.');
      } else {
        setSubmitError('Fehler beim Eintragen. Bitte versuche es erneut.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnregister = async (entryId: number) => {
    setIsDeleting(entryId);
    try {
      await deleteTrainingEntry(entryId);
      onEntryAdded(); // Refresh data
    } catch (error) {
      console.error('Error deleting entry:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancelScheduledTrainer = async (entry: any) => {
    if (!entry.schedule_id) return;
    
    setIsDeleting(entry.id);
    try {
      await cancelScheduledTrainer(entry.schedule_id, entry.training_date, 'Trainer nicht verfügbar');
      onEntryAdded(); // Refresh data
    } catch (error) {
      console.error('Error canceling scheduled trainer:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEntryClick = () => {
    if (!isAuthenticated) {
      onAuthRequired();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-kaisho-greyLight flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-kaisho-greyLight p-5 md:p-6 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-kaisho-blue tracking-tight">
              {format(date, 'EEEE', { locale: de })}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {format(date, 'd. MMMM yyyy', { locale: de })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-kaisho-blue text-2xl font-light w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-kaisho-blueIce transition-all duration-300 active:scale-95"
          >
            ✕
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Trainingszeiten */}
          <div>
            <h3 className="font-semibold text-kaisho-blue mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">🏋️</span>
              Trainingszeiten
            </h3>
            <div className="space-y-3">
              {slots.map((slot, idx) => {
                const trainerEntry = getTrainerEntryForSlot(slot);
                const slotEntries = getEntriesForSlot(slot);
                const hasNoTrainers = slotEntries.length === 0 && !slot.isCancelled;
                
                return (
                  <div
                    key={idx}
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                      slot.isCancelled
                        ? 'border-red-300 bg-red-50'
                        : trainerEntry
                        ? 'border-emerald-300 bg-emerald-50'
                        : hasNoTrainers
                        ? 'border-red-300 bg-red-50'
                        : slot.isExtra
                        ? 'border-kaisho-blueLight bg-kaisho-blueIce'
                        : 'border-gray-200 bg-gray-50 hover:bg-kaisho-blueIce'
                    }`}
                  >
                    {/* Status Indicator Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      slot.isCancelled
                        ? 'bg-red-500'
                        : trainerEntry
                        ? 'bg-emerald-500'
                        : hasNoTrainers
                        ? 'bg-red-500'
                        : slot.isExtra
                        ? 'bg-kaisho-blueLight'
                        : 'bg-kaisho-blue'
                    }`} />
                    
                    <div className="p-4 pl-5">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`text-xl font-bold tracking-tight ${
                              slot.isCancelled ? 'text-gray-400 line-through' : 'text-kaisho-blue'
                            }`}>
                              {slot.timeStart.slice(0, 5)}
                              {slot.timeEnd && (
                                <span className="text-gray-500 font-normal"> – {slot.timeEnd.slice(0, 5)}</span>
                              )}
                            </span>
                            
                            {/* Status Badges */}
                            <div className="flex gap-2 flex-wrap">
                              {slot.isCancelled && (
                                <span className="inline-flex items-center gap-1 text-xs text-red-700 font-semibold bg-red-100 px-3 py-1.5 rounded-full">
                                  <span>❌</span> Abgesagt
                                </span>
                              )}
                              {trainerEntry && !slot.isCancelled && (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-100 px-3 py-1.5 rounded-full">
                                  <span>✓</span> Eingetragen
                                </span>
                              )}
                              {hasNoTrainers && (
                                <span className="inline-flex items-center gap-1 text-xs text-red-700 font-semibold bg-red-100 px-3 py-1.5 rounded-full animate-pulse">
                                  <span>⚠️</span> Kein Trainer
                                </span>
                              )}
                              {slot.isExtra && !slot.isCancelled && !trainerEntry && !hasNoTrainers && (
                                <span className="inline-flex items-center gap-1 text-xs text-kaisho-blue font-semibold bg-kaisho-blueIce px-3 py-1.5 rounded-full">
                                  <span>✨</span> Extra
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Trainer Count */}
                          {!slot.isCancelled && (
                            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                slotEntries.length === 0 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {slotEntries.length}
                              </span>
                              {slotEntries.length === 1 ? 'Trainer eingetragen' : 'Trainer eingetragen'}
                            </p>
                          )}
                          
                          {slot.reason && (
                            <p className="text-sm mt-2 text-gray-600 italic">
                              „{slot.reason}"
                            </p>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {/* Austragen Button */}
                          {trainerEntry && !slot.isCancelled && (
                            <button
                              onClick={() => handleUnregister(trainerEntry.id)}
                              disabled={isDeleting === trainerEntry.id}
                              className="px-4 py-2 bg-orange-500/80 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 active:scale-95 shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                              {isDeleting === trainerEntry.id ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <>
                                  <span>↩</span>
                                  <span className="hidden md:inline">Austragen</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* Absage aufheben Button for Admin */}
                          {isAdmin && !slot.isExtra && slot.isCancelled && slot.overrideId && (
                            <button
                              onClick={() => handleUncancelClick(slot)}
                              disabled={isUncancelling === slot.trainingDayId}
                              className="px-4 py-2 bg-emerald-500/80 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 active:scale-95 shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                              {isUncancelling === slot.trainingDayId ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <>
                                  <span>↩</span>
                                  <span className="hidden md:inline">Absage aufheben</span>
                                  <span className="md:hidden">Aufheben</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* Cancel Button for Admin */}
                          {isAdmin && !slot.isExtra && !slot.isCancelled && (
                            <button
                              onClick={() => handleCancelClick(slot)}
                              className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 active:scale-95 shadow-lg"
                            >
                              Absagen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bestehende Einträge - Nur für eingeloggte User */}
          {isAuthenticated && dateEntries.length > 0 && (
            <div>
              <h3 className="font-semibold text-kaisho-blue mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-8 bg-kaisho-blueIce rounded-lg flex items-center justify-center">👥</span>
                Eingetragene Trainer
                <span className="ml-auto bg-kaisho-blueIce text-kaisho-blue px-3 py-1 rounded-full text-xs font-bold">
                  {dateEntries.length}
                </span>
              </h3>
              <div className="grid gap-2">
                {dateEntries.map((entry) => {
                  const isOwnEntry = trainer && entry.trainer_id === trainer.id;
                  const isScheduledEntry = entry.id < 0; // Virtuelle Einträge haben negative IDs
                  // Finde den passenden Slot für diesen Eintrag
                  const entrySlot = slots.find(s => 
                    entry.override_id ? s.overrideId === entry.override_id : s.trainingDayId === entry.training_day_id
                  );
                  
                  return (
                    <div
                      key={entry.id}
                      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                        isScheduledEntry
                          ? 'bg-blue-50 border-blue-300'
                          : isOwnEntry 
                          ? 'bg-emerald-50 border-emerald-300' 
                          : 'bg-gray-50 border-gray-200 hover:bg-kaisho-blueIce'
                      }`}
                    >
                      <div className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                            isScheduledEntry
                              ? 'bg-blue-200 text-blue-700'
                              : isOwnEntry 
                              ? 'bg-emerald-200 text-emerald-700' 
                              : 'bg-kaisho-blueIce text-kaisho-blue'
                          }`}>
                            {entry.trainer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              {entry.trainer_name}
                              {isScheduledEntry && (
                                <span className="text-xs text-blue-600 font-medium">📅 Geplant</span>
                              )}
                              {isOwnEntry && (
                                <span className="text-xs text-emerald-600 font-medium">(Du)</span>
                              )}
                            </div>
                            {/* Zeige Trainingszeit */}
                            {entrySlot && (
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <span>🕒</span>
                                {entrySlot.timeStart.slice(0, 5)}
                                {entrySlot.timeEnd && ` – ${entrySlot.timeEnd.slice(0, 5)}`}
                                {entrySlot.isExtra && (
                                  <span className="ml-1 text-purple-500">✨ Extra</span>
                                )}
                              </p>
                            )}
                            {entry.remark && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {entry.remark}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {isOwnEntry && !isScheduledEntry && (
                          <button
                            onClick={() => handleUnregister(entry.id)}
                            disabled={isDeleting === entry.id}
                            className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-red-500/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all duration-300 active:scale-95"
                          >
                            {isDeleting === entry.id ? '...' : '✕'}
                          </button>
                        )}
                        
                        {isScheduledEntry && (isOwnEntry || isAdmin) && (
                          <button
                            onClick={() => handleCancelScheduledTrainer(entry)}
                            disabled={isDeleting === entry.id}
                            className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-orange-500/80 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-all duration-300 active:scale-95 flex items-center gap-1"
                            title="Geplanten Trainer für diesen Tag austragen"
                          >
                            {isDeleting === entry.id ? '...' : (
                              <>
                                <span>↩</span>
                                <span className="hidden md:inline">Austragen</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Datenschutz-Hinweis für nicht eingeloggte User */}
          {!isAuthenticated && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="font-semibold text-amber-800 mb-1">Datenschutz</p>
                  <p className="text-sm text-amber-700">
                    Trainer-Einträge sind nur nach dem Login sichtbar.
                    Melden Sie sich an, um zu sehen, wer bereits eingetragen ist.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Eintragen-Formular */}
          {isAuthenticated ? (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-kaisho-blue mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">✍️</span>
                Eintragen
              </h3>
              
              {/* Check if all slots are cancelled */}
              {slots.every(slot => slot.isCancelled) ? (
                <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-center">
                  <span className="text-3xl mb-3 block">❌</span>
                  <p className="text-red-700 font-semibold">
                    Alle Trainings an diesem Tag wurden abgesagt.
                  </p>
                  <p className="text-red-600 text-sm mt-2">
                    Es können keine Einträge vorgenommen werden.
                  </p>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Fehlermeldung */}
                {submitError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 font-medium text-sm flex items-center gap-2">
                      <span>⚠️</span> {submitError}
                    </p>
                  </div>
                )}
                
                {/* Immer Trainingszeit-Auswahl anzeigen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trainingszeit wählen *
                  </label>
                  <select
                    value={selectedSlot ? (selectedSlot.isExtra ? `extra-${selectedSlot.overrideId}` : `day-${selectedSlot.trainingDayId}`) : ''}
                    onChange={(e) => {
                      setSubmitError(null); // Clear error on selection change
                      const value = e.target.value;
                      if (!value) {
                        setSelectedSlot(null);
                        return;
                      }
                      const idx = Number(value.split('-')[1]);
                      const slot = slots.find(s => 
                        value.startsWith('extra-') ? s.overrideId === idx : s.trainingDayId === idx
                      );
                      setSelectedSlot(slot || null);
                    }}
                    required
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="">Bitte Training wählen...</option>
                    {slots.filter(s => !s.isCancelled).map((slot, idx) => {
                      const slotEntries = getEntriesForSlot(slot);
                      const alreadyRegistered = getTrainerEntryForSlot(slot);
                      return (
                        <option 
                          key={idx} 
                          value={slot.isExtra ? `extra-${slot.overrideId}` : `day-${slot.trainingDayId}`}
                          disabled={!!alreadyRegistered}
                        >
                          {slot.timeStart.slice(0, 5)}
                          {slot.timeEnd && ` – ${slot.timeEnd.slice(0, 5)}`}
                          {slot.isExtra && ' ✨ Extra-Training'}
                          {` (✓ ${slotEntries.length} Trainer)`}
                          {alreadyRegistered && ' - Bereits eingetragen'}
                        </option>
                      );
                    })}
                  </select>
                  {slots.filter(s => !s.isCancelled).length > 1 && (
                    <p className="text-xs text-gray-500 mt-2">
                      ⚠️ Wählen Sie das Training, für das Sie sich eintragen möchten
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trainer
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      {trainer?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-800 font-medium">{trainer?.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bemerkung <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="z.B. Vertretung, besondere Themen..."
                    rows={3}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all duration-300 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !selectedSlot}
                  className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 font-bold text-lg shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Speichern...
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      Eintragen
                    </>
                  )}
                </button>
              </form>
              )}
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleEntryClick}
                className="w-full py-4 px-4 bg-gradient-to-r from-kaisho-blue to-kaisho-blueLight hover:from-kaisho-blueLight hover:to-kaisho-blue text-white rounded-xl transition-all duration-300 font-bold text-lg shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>🔐</span>
                Anmelden um sich einzutragen
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
            onEntryAdded();
            onClose();
          }}
        />
      )}
    </div>
  );
}
