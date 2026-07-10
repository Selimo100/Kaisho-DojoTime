import { useState } from 'react';
import { Plus } from 'lucide-react';
import { createTrainingDay } from '../lib/supabaseService';
import { WEEKDAY_NAMES } from '../utils/formatters';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface AddTrainingDayModalProps {
  clubId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass =
  'w-full px-3 py-2 bg-white border border-kaisho-greyLight rounded-lg text-gray-800 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kaisho-blueLight/40 focus:border-kaisho-blueLight transition-colors';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function AddTrainingDayModal({ clubId, onClose, onSuccess }: AddTrainingDayModalProps) {
  const [weekday, setWeekday] = useState(1);
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [trainingName, setTrainingName] = useState('');
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
      await createTrainingDay({
        club_id: clubId,
        weekday,
        time_start: timeStart,
        time_end: timeEnd || undefined,
        name: trainingName.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding training day:', err);
      setError('Fehler beim Erstellen des Trainingstags');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Neuer Trainingstag"
      subtitle="Wiederkehrendes Training an einem Wochentag"
      maxWidth="max-w-lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            form="add-training-day-form"
            disabled={isLoading}
            icon={<Plus className="w-4 h-4" />}
          >
            {isLoading ? 'Wird hinzugefügt…' : 'Hinzufügen'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form id="add-training-day-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>
            Name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={trainingName}
            onChange={(e) => setTrainingName(e.target.value)}
            placeholder="z.B. Kids-Training, Wettkampfgruppe"
            maxLength={60}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Wochentag</label>
          <select
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
            required
            className={inputClass}
          >
            {WEEKDAY_NAMES.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Startzeit</label>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Endzeit <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
