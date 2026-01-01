import { useState, useEffect } from 'react';
import { TrainingDay, CreateTrainerScheduleInput } from '../types';
import { createTrainerWithSchedule } from '../lib/supabaseService';
import { getWeekdayName, formatTime } from '../utils/formatters';

interface CreateTrainerModalProps {
  clubId: string;
  clubName: string;
  trainingDays: TrainingDay[];
  onClose: () => void;
  onSuccess: () => void;
  adminId?: number;
}

interface ScheduleItem extends CreateTrainerScheduleInput {
  tempId: string; // Für eindeutige Keys in der Liste
}

export default function CreateTrainerModal({
  clubId,
  clubName,
  trainingDays,
  onClose,
  onSuccess,
  adminId,
}: CreateTrainerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Schedule State
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedTrainingDay, setSelectedTrainingDay] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Setze Startdatum auf heute
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
  }, []);

  const handleAddSchedule = () => {
    if (selectedTrainingDay === '') {
      setError('Bitte wählen Sie einen Trainingstag aus.');
      return;
    }
    
    if (!startDate) {
      setError('Bitte geben Sie ein Startdatum an.');
      return;
    }
    
    if (!noEndDate && endDate && endDate < startDate) {
      setError('Enddatum muss nach dem Startdatum liegen.');
      return;
    }

    const newSchedule: ScheduleItem = {
      tempId: `${Date.now()}-${Math.random()}`,
      training_day_id: Number(selectedTrainingDay),
      start_date: startDate,
      end_date: noEndDate ? null : endDate || null,
      notes: notes || undefined,
    };

    setSchedules([...schedules, newSchedule]);
    
    // Reset form
    setSelectedTrainingDay('');
    setNotes('');
    setNoEndDate(false);
    setEndDate('');
    setError('');
  };

  const handleRemoveSchedule = (tempId: string) => {
    setSchedules(schedules.filter(s => s.tempId !== tempId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validierung
    if (!name.trim() || !email.trim() || !password) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    if (schedules.length === 0) {
      setError('Bitte fügen Sie mindestens einen Trainingsplan hinzu.');
      return;
    }

    setIsLoading(true);

    try {
      await createTrainerWithSchedule(
        {
          email: email.trim(),
          name: name.trim(),
          password,
          club_id: clubId,
          schedules: schedules.map(({ tempId, ...rest }) => rest),
        },
        adminId
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating trainer:', err);
      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        setError('Ein Trainer mit dieser E-Mail-Adresse existiert bereits.');
      } else {
        setError('Fehler beim Erstellen des Trainers. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTrainingDayInfo = (trainingDayId: number) => {
    const day = trainingDays.find(d => d.id === trainingDayId);
    if (!day) return 'Unbekannt';
    return `${getWeekdayName(day.weekday)} ${formatTime(day.time_start)}${day.time_end ? ` - ${formatTime(day.time_end)}` : ''}`;
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-kaisho-blueLight to-kaisho-blue p-4 md:p-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              👤 Neuen Trainer erstellen
            </h2>
            <p className="text-white/80 text-sm mt-1">{clubName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-all text-3xl font-bold w-10 h-10 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Trainer Grunddaten */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-kaisho-blue border-b-2 border-kaisho-blueIce pb-2">
                📋 Trainer-Informationen
              </h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Max Mustermann"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="trainer@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Passwort *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mindestens 6 Zeichen"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Passwort bestätigen *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Passwort wiederholen"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Trainingsplan */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-kaisho-blue border-b-2 border-kaisho-blueIce pb-2">
                📅 Trainingsplan festlegen
              </h3>
              
              <p className="text-sm text-gray-600">
                Legen Sie fest, an welchen Trainingstagen dieser Trainer verfügbar ist und für welchen Zeitraum.
              </p>

              {/* Schedule hinzufügen */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 border-2 border-gray-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Trainingstag
                  </label>
                  <select
                    value={selectedTrainingDay}
                    onChange={(e) => setSelectedTrainingDay(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
                  >
                    <option value="">-- Trainingstag wählen --</option>
                    {trainingDays.map((day) => (
                      <option key={day.id} value={day.id}>
                        {getWeekdayName(day.weekday)} {formatTime(day.time_start)}
                        {day.time_end && ` - ${formatTime(day.time_end)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enddatum
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={noEndDate}
                      min={startDate}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all disabled:bg-gray-200 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noEndDate}
                    onChange={(e) => {
                      setNoEndDate(e.target.checked);
                      if (e.target.checked) setEndDate('');
                    }}
                    className="w-5 h-5 text-kaisho-blue rounded focus:ring-2 focus:ring-kaisho-blueLight"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Kein Enddatum (unbegrenzt)
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notizen (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="z.B. Haupttrainer, Vertretung, etc."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddSchedule}
                  className="w-full px-4 py-3 bg-kaisho-blueLight hover:bg-kaisho-blue text-white font-bold rounded-xl transition-all active:scale-95"
                >
                  ➕ Zum Trainingsplan hinzufügen
                </button>
              </div>

              {/* Liste der hinzugefügten Schedules */}
              {schedules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-700">
                    📝 Geplante Trainingstage ({schedules.length})
                  </h4>
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.tempId}
                      className="bg-kaisho-blueIce border-2 border-kaisho-blueLight rounded-xl p-3 flex justify-between items-start gap-3"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-kaisho-blue text-sm">
                          {getTrainingDayInfo(schedule.training_day_id)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="font-semibold">Von:</span> {formatDateDisplay(schedule.start_date)}
                          {' '} 
                          <span className="font-semibold">Bis:</span>{' '}
                          {schedule.end_date ? formatDateDisplay(schedule.end_date) : 'unbegrenzt'}
                        </div>
                        {schedule.notes && (
                          <div className="text-xs text-gray-600 mt-1 italic">
                            💬 {schedule.notes}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(schedule.tempId)}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col md:flex-row gap-3 pt-4 border-t-2 border-gray-200">
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
                disabled={isLoading || schedules.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-kaisho-blueLight to-kaisho-blue hover:from-kaisho-blue hover:to-kaisho-blueLight text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                    Erstelle Trainer...
                  </span>
                ) : (
                  '✅ Trainer erstellen'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
