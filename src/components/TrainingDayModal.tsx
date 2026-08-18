import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TrainingSlot, TrainingEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { createTrainingEntry, deleteTrainingEntry, deleteOverride, cancelScheduledTrainer, getTrainersByClub } from '../lib/supabaseService';
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
  // null = Auswahl entspricht dem gespeicherten Stand
  const [draftSlotKeys, setDraftSlotKeys] = useState<string[] | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle');
  const [remark, setRemark] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUncancelling, setIsUncancelling] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [slotToCancel, setSlotToCancel] = useState<TrainingSlot | null>(null);

  // Admin: andere Trainer eintragen
  const [showAdminAssign, setShowAdminAssign] = useState(false);
  const [clubTrainers, setClubTrainers] = useState<{ id: string; name: string }[]>([]);
  const [assignTrainerId, setAssignTrainerId] = useState('');
  const [assignSlotKeys, setAssignSlotKeys] = useState<string[]>([]);
  const [assignRemark, setAssignRemark] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const slotKey = (slot: TrainingSlot) =>
    slot.isExtra ? `extra-${slot.overrideId}` : `day-${slot.trainingDayId}`;

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

  // Finde den zugehörigen Slot eines Eintrags
  const getSlotForEntry = (entry: TrainingEntry) =>
    slots.find(s =>
      entry.override_id ? s.overrideId === entry.override_id : s.trainingDayId === entry.training_day_id
    );

  // Einträge nach Trainingszeit sortieren
  const sortedDateEntries = [...dateEntries].sort((a, b) => {
    const timeA = getSlotForEntry(a)?.timeStart ?? '99:99';
    const timeB = getSlotForEntry(b)?.timeStart ?? '99:99';
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    return a.trainer_name.localeCompare(b.trainer_name);
  });

  // Trainings, für die eine Eintragung möglich ist
  const selectableSlots = slots.filter((s) => !s.isCancelled);
  // Gespeicherter Stand: Slots, für die der Trainer bereits eingetragen ist
  const savedSlotKeys = selectableSlots.filter((s) => getTrainerEntryForSlot(s)).map(slotKey);
  // Angezeigte Auswahl (Entwurf, solange noch nicht gespeichert)
  const selectedSlotKeys = draftSlotKeys ?? savedSlotKeys;
  const allSelected =
    selectableSlots.length > 0 &&
    selectableSlots.every((s) => selectedSlotKeys.includes(slotKey(s)));

  const sameKeys = (a: string[], b: string[]) =>
    a.length === b.length && a.every((k) => b.includes(k));

  const toggleSlotSelection = (slot: TrainingSlot) => {
    setSubmitError(null);
    const key = slotKey(slot);
    const next = selectedSlotKeys.includes(key)
      ? selectedSlotKeys.filter((k) => k !== key)
      : [...selectedSlotKeys, key];
    setDraftSlotKeys(next);
    setSaveState('pending');
  };

  const selectAll = () => {
    setSubmitError(null);
    setDraftSlotKeys(allSelected ? [] : selectableSlots.map(slotKey));
    setSaveState('pending');
  };

  // Entwurf verwerfen, sobald der gespeicherte Stand ihn eingeholt hat
  useEffect(() => {
    if (draftSlotKeys && saveState !== 'pending' && sameKeys(draftSlotKeys, savedSlotKeys)) {
      setDraftSlotKeys(null);
    }
  });

  // Nach dem Speichern zurück in den Ruhezustand
  useEffect(() => {
    if (saveState !== 'saved') return;
    const timer = setTimeout(() => {
      setDraftSlotKeys(null);
      setSaveState('idle');
    }, 2500);
    return () => clearTimeout(timer);
  }, [saveState]);

  // Autosave: kurz nach der letzten Auswahländerung speichern
  const remarkRef = useRef(remark);
  remarkRef.current = remark;

  useEffect(() => {
    if (!draftSlotKeys || saveState !== 'pending' || !trainer) return;

    const target = draftSlotKeys;
    const timer = setTimeout(async () => {
      const toAdd = selectableSlots.filter(
        (s) => target.includes(slotKey(s)) && !getTrainerEntryForSlot(s)
      );
      const toRemove = selectableSlots
        .filter((s) => !target.includes(slotKey(s)))
        .map((s) => getTrainerEntryForSlot(s))
        .filter((entry): entry is TrainingEntry => !!entry && entry.id > 0);

      if (toAdd.length === 0 && toRemove.length === 0) {
        setSaveState('saved');
        return;
      }

      setSaveState('saving');
      setSubmitError(null);

      const newRemark = remarkRef.current.trim() || undefined;
      let failed = 0;
      let duplicate = false;

      for (const slot of toAdd) {
        try {
          await createTrainingEntry({
            club_id: clubId,
            training_day_id: slot.isExtra ? null : slot.trainingDayId,
            override_id: slot.isExtra ? slot.overrideId : undefined,
            training_date: format(date, 'yyyy-MM-dd'),
            trainer_id: trainer.id,
            trainer_name: trainer.name,
            remark: newRemark,
          });
        } catch (error: any) {
          console.error('Error creating entry:', error);
          failed++;
          if (error?.code === '23505') duplicate = true;
        }
      }

      for (const entry of toRemove) {
        try {
          await deleteTrainingEntry(entry.id);
        } catch (error) {
          console.error('Error deleting entry:', error);
          failed++;
        }
      }

      if (failed === 0) {
        setSaveState('saved');
      } else {
        setSaveState('idle');
        setDraftSlotKeys(null);
        setSubmitError(
          duplicate
            ? 'Du bist bereits für ein gewähltes Training eingetragen! Bitte lade die Seite neu.'
            : 'Nicht alle Änderungen konnten gespeichert werden. Bitte versuche es erneut.'
        );
      }

      onEntryAdded();
    }, 700);

    return () => clearTimeout(timer);
  }, [draftSlotKeys, saveState, trainer]);

  // Admin: Trainerliste des Clubs laden, sobald der Bereich geöffnet wird
  useEffect(() => {
    if (!showAdminAssign || !isAdmin || clubTrainers.length > 0) return;
    getTrainersByClub(clubId)
      .then((data) => setClubTrainers(data.map((t: any) => ({ id: t.id, name: t.name }))))
      .catch((error) => {
        console.error('Error loading trainers:', error);
        setAssignError('Trainerliste konnte nicht geladen werden.');
      });
  }, [showAdminAssign, isAdmin, clubId]);

  const toggleAssignSlot = (slot: TrainingSlot) => {
    setAssignError(null);
    setAssignSuccess(null);
    const key = slotKey(slot);
    setAssignSlotKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleAssignTrainer = async () => {
    const selected = clubTrainers.find((t) => t.id === assignTrainerId);
    if (!selected || assignSlotKeys.length === 0 || isAssigning) return;

    const targetSlots = selectableSlots.filter((s) => assignSlotKeys.includes(slotKey(s)));
    setIsAssigning(true);
    setAssignError(null);
    setAssignSuccess(null);

    let failed = 0;
    for (const slot of targetSlots) {
      try {
        await createTrainingEntry({
          club_id: clubId,
          training_day_id: slot.isExtra ? null : slot.trainingDayId,
          override_id: slot.isExtra ? slot.overrideId : undefined,
          training_date: format(date, 'yyyy-MM-dd'),
          trainer_id: selected.id,
          trainer_name: selected.name,
          remark: assignRemark.trim() || undefined,
        });
      } catch (error: any) {
        console.error('Error assigning trainer:', error);
        failed++;
      }
    }

    if (failed === 0) {
      setAssignSuccess(
        `${selected.name} für ${targetSlots.length} ${targetSlots.length === 1 ? 'Training' : 'Trainings'} eingetragen.`
      );
      setAssignSlotKeys([]);
      setAssignRemark('');
    } else {
      setAssignError(
        failed === targetSlots.length
          ? 'Eintragen fehlgeschlagen. Eventuell ist der Trainer bereits eingetragen.'
          : `${failed} von ${targetSlots.length} Trainings konnten nicht eingetragen werden.`
      );
    }

    onEntryAdded();
    setIsAssigning(false);
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
                          {slot.name && (
                            <div className={`text-base font-bold mb-1 ${
                              slot.isCancelled ? 'text-gray-400 line-through' : 'text-gray-800'
                            }`}>
                              {slot.name}
                            </div>
                          )}
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
                                  Abgesagt
                                </span>
                              )}
                              {trainerEntry && !slot.isCancelled && (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-100 px-3 py-1.5 rounded-full">
                                  Eingetragen
                                </span>
                              )}
                              {hasNoTrainers && (
                                <span className="inline-flex items-center gap-1 text-xs text-red-700 font-semibold bg-red-100 px-3 py-1.5 rounded-full animate-pulse">
                                  Kein Trainer
                                </span>
                              )}
                              {slot.isExtra && !slot.isCancelled && !trainerEntry && !hasNoTrainers && (
                                <span className="inline-flex items-center gap-1 text-xs text-kaisho-blue font-semibold bg-kaisho-blueIce px-3 py-1.5 rounded-full">
                                  Extra
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
                                <span>...</span>
                              ) : (
                                <>
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
                                <span>...</span>
                              ) : (
                                <>
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
                Eingetragene Trainer
                <span className="ml-auto bg-kaisho-blueIce text-kaisho-blue px-3 py-1 rounded-full text-xs font-bold">
                  {dateEntries.length}
                </span>
              </h3>
              <div className="grid gap-2">
                {sortedDateEntries.map((entry) => {
                  const isOwnEntry = trainer && entry.trainer_id === trainer.id;
                  const isScheduledEntry = entry.id < 0; // Virtuelle Einträge haben negative IDs
                  const entrySlot = getSlotForEntry(entry);

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
                                <span className="text-xs text-blue-600 font-medium">Geplant</span>
                              )}
                              {isOwnEntry && (
                                <span className="text-xs text-emerald-600 font-medium">(Du)</span>
                              )}
                            </div>
                            {/* Zeige Trainingszeit */}
                            {entrySlot && (
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                {entrySlot.timeStart.slice(0, 5)}
                                {entrySlot.timeEnd && ` – ${entrySlot.timeEnd.slice(0, 5)}`}
                                {entrySlot.isExtra && (
                                  <span className="ml-1 text-purple-500">Extra</span>
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
                Eintragen
              </h3>
              
              {/* Check if all slots are cancelled */}
              {slots.every(slot => slot.isCancelled) ? (
                <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-center">
                  <p className="text-red-700 font-semibold">
                    Alle Trainings an diesem Tag wurden abgesagt.
                  </p>
                  <p className="text-red-600 text-sm mt-2">
                    Es können keine Einträge vorgenommen werden.
                  </p>
                </div>
              ) : (
              <div className="space-y-4">
                {/* Fehlermeldung */}
                {submitError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 font-medium text-sm flex items-center gap-2">
                      {submitError}
                    </p>
                  </div>
                )}
                
                {/* Mehrfachauswahl der Trainings */}
                <div>
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Trainings wählen
                    </label>
                    {selectableSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={selectAll}
                        className="text-xs font-semibold text-kaisho-blue hover:text-kaisho-blueLight transition-colors duration-200"
                      >
                        {allSelected ? 'Auswahl aufheben' : 'Alle auswählen'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {selectableSlots.map((slot, idx) => {
                      const slotEntries = getEntriesForSlot(slot);
                      const alreadyRegistered = getTrainerEntryForSlot(slot);
                      const key = slotKey(slot);
                      const isSelected = selectedSlotKeys.includes(key);

                      return (
                        <label
                          key={idx}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-gray-300 bg-gray-50 hover:border-kaisho-blueLight hover:bg-kaisho-blueIce'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSlotSelection(slot)}
                            className="sr-only"
                          />
                          <span
                            className={`w-5 h-5 flex-shrink-0 rounded-md border flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path
                                  fillRule="evenodd"
                                  d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>

                          <span className="flex-1 min-w-0">
                            <span className="flex items-baseline gap-2 flex-wrap">
                              <span className="font-semibold text-gray-800">
                                {slot.timeStart.slice(0, 5)}
                                {slot.timeEnd && ` – ${slot.timeEnd.slice(0, 5)}`}
                              </span>
                              {slot.name && (
                                <span className="text-sm text-gray-600 truncate">{slot.name}</span>
                              )}
                              {slot.isExtra && (
                                <span className="text-xs font-semibold text-kaisho-blue bg-kaisho-blueIce px-2 py-0.5 rounded-full">
                                  Extra
                                </span>
                              )}
                            </span>
                            <span className="block text-xs text-gray-500 mt-0.5">
                              {alreadyRegistered
                                ? `Du bist eingetragen · ${slotEntries.length} Trainer`
                                : `${slotEntries.length} Trainer eingetragen`}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-2 text-xs">
                    <p className="text-gray-500">
                      {selectedSlotKeys.length === 0
                        ? 'Wähle ein oder mehrere Trainings aus – wird automatisch gespeichert.'
                        : `${selectedSlotKeys.length} ${selectedSlotKeys.length === 1 ? 'Training' : 'Trainings'} ausgewählt`}
                    </p>
                    <p
                      className={`font-semibold whitespace-nowrap transition-opacity duration-300 ${
                        saveState === 'idle' ? 'opacity-0' : 'opacity-100'
                      } ${saveState === 'saved' ? 'text-emerald-600' : 'text-gray-500'}`}
                    >
                      {saveState === 'saving'
                        ? 'Wird gespeichert...'
                        : saveState === 'saved'
                        ? 'Gespeichert'
                        : 'Änderung wird gespeichert...'}
                    </p>
                  </div>
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
                    Bemerkung <span className="text-gray-400">(optional, vor der Auswahl erfassen)</span>
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="z.B. Vertretung, besondere Themen..."
                    rows={3}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all duration-300 resize-none"
                  />
                </div>

              </div>
              )}

            </div>
          ) : (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleEntryClick}
                className="w-full py-4 px-4 bg-gradient-to-r from-kaisho-blue to-kaisho-blueLight hover:from-kaisho-blueLight hover:to-kaisho-blue text-white rounded-xl transition-all duration-300 font-bold text-lg shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Anmelden um sich einzutragen
              </button>
            </div>
          )}

            {/* Admin: Trainer eintragen */}
            {isAdmin && selectableSlots.length > 0 && (
              <div className="mt-6 border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdminAssign((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-kaisho-blueIce transition-colors duration-200 text-left"
                >
                  <span>
                    <span className="block text-sm font-semibold text-kaisho-blue">
                      Trainer eintragen
                    </span>
                    <span className="block text-xs text-gray-500">
                      Als Admin andere Trainer für dieses Datum eintragen
                    </span>
                  </span>
                  <span className={`text-gray-400 transition-transform duration-200 ${showAdminAssign ? 'rotate-180' : ''}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path
                        fillRule="evenodd"
                        d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>

                {showAdminAssign && (
                  <div className="p-4 space-y-4 border-t border-gray-200">
                    {assignError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-700 text-sm font-medium">{assignError}</p>
                      </div>
                    )}
                    {assignSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <p className="text-emerald-700 text-sm font-medium">{assignSuccess}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trainer
                      </label>
                      <select
                        value={assignTrainerId}
                        onChange={(e) => {
                          setAssignTrainerId(e.target.value);
                          setAssignError(null);
                          setAssignSuccess(null);
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all duration-300 cursor-pointer"
                      >
                        <option value="">Trainer wählen...</option>
                        {clubTrainers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trainings
                      </label>
                      <div className="space-y-2">
                        {selectableSlots.map((slot, idx) => {
                          const key = slotKey(slot);
                          const isSelected = assignSlotKeys.includes(key);
                          const alreadyIn = assignTrainerId
                            ? getEntriesForSlot(slot).some((e) => e.trainer_id === assignTrainerId)
                            : false;

                          return (
                            <label
                              key={idx}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                                alreadyIn
                                  ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                  : isSelected
                                  ? 'border-kaisho-blueLight bg-kaisho-blueIce cursor-pointer'
                                  : 'border-gray-300 bg-gray-50 hover:border-kaisho-blueLight cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected && !alreadyIn}
                                disabled={alreadyIn}
                                onChange={() => toggleAssignSlot(slot)}
                                className="sr-only"
                              />
                              <span
                                className={`w-5 h-5 flex-shrink-0 rounded-md border flex items-center justify-center transition-all duration-200 ${
                                  isSelected && !alreadyIn
                                    ? 'bg-kaisho-blue border-kaisho-blue text-white'
                                    : 'bg-white border-gray-300'
                                }`}
                              >
                                {isSelected && !alreadyIn && (
                                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="flex items-baseline gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-800">
                                    {slot.timeStart.slice(0, 5)}
                                    {slot.timeEnd && ` – ${slot.timeEnd.slice(0, 5)}`}
                                  </span>
                                  {slot.name && (
                                    <span className="text-sm text-gray-600 truncate">{slot.name}</span>
                                  )}
                                  {slot.isExtra && (
                                    <span className="text-xs font-semibold text-kaisho-blue bg-white px-2 py-0.5 rounded-full">
                                      Extra
                                    </span>
                                  )}
                                </span>
                                {alreadyIn && (
                                  <span className="block text-xs text-gray-500 mt-0.5">
                                    Bereits eingetragen
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bemerkung <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={assignRemark}
                        onChange={(e) => setAssignRemark(e.target.value)}
                        placeholder="z.B. Vertretung"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all duration-300"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAssignTrainer}
                      disabled={isAssigning || !assignTrainerId || assignSlotKeys.length === 0}
                      className="w-full py-3 px-4 bg-kaisho-blue hover:bg-kaisho-blueLight text-white rounded-xl transition-all duration-300 font-semibold shadow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {isAssigning
                        ? 'Wird eingetragen...'
                        : assignSlotKeys.length > 1
                        ? `Für ${assignSlotKeys.length} Trainings eintragen`
                        : 'Trainer eintragen'}
                    </button>
                  </div>
                )}
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
