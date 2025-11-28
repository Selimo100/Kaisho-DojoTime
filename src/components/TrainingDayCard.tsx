import { useState } from 'react';
import type { TrainingDay, TrainingEntry } from '../types';
import { getWeekdayName, formatTime, formatDate } from '../utils/formatters';
import { createTrainingEntry } from '../lib/supabaseService';
import { useAuth } from '../context/AuthContext';

interface TrainingDayCardProps {
  trainingDay: TrainingDay;
  clubId: string;
  entries: TrainingEntry[];
  onEntryAdded: () => void;
  onAuthRequired: () => void;
}

export default function TrainingDayCard({
  trainingDay,
  clubId,
  entries,
  onEntryAdded,
  onAuthRequired,
}: TrainingDayCardProps) {
  const { trainer, isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [remark, setRemark] = useState('');
  const [trainingDate, setTrainingDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingDate || !trainer) return;

    setIsLoading(true);
    try {
      await createTrainingEntry({
        club_id: clubId,
        training_day_id: trainingDay.id,
        training_date: trainingDate,
        trainer_id: trainer.id,
        trainer_name: trainer.name,
        remark: remark.trim() || undefined,
      });

      // Reset form
      setRemark('');
      setTrainingDate('');
      setShowForm(false);
      onEntryAdded();
    } catch (error) {
      console.error('Error creating entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntryClick = () => {
    if (!isAuthenticated) {
      onAuthRequired();
    } else {
      setShowForm(true);
    }
  };

  const filteredEntries = trainingDate
    ? entries.filter((e) => e.training_date === trainingDate)
    : entries.slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          {getWeekdayName(trainingDay.weekday)}
        </h3>
        <p className="text-gray-600">
          {formatTime(trainingDay.time_start)}
          {trainingDay.time_end && ` - ${formatTime(trainingDay.time_end)}`}
        </p>
      </div>

      {/* Existing entries */}
      {filteredEntries.length > 0 && (
        <div className="mb-4 space-y-2">
          <h4 className="font-medium text-gray-700 text-sm">Einträge:</h4>
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-50 p-3 rounded border border-gray-200"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-gray-800">
                  {entry.trainer_name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(entry.training_date)}
                </span>
              </div>
              {entry.remark && (
                <p className="text-sm text-gray-600">{entry.remark}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add entry form */}
      {!showForm ? (
        <button
          onClick={handleEntryClick}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          {isAuthenticated ? 'Eintragen' : 'Anmelden & Eintragen'}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datum *
            </label>
            <input
              type="date"
              value={trainingDate}
              onChange={(e) => setTrainingDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trainer
            </label>
            <input
              type="text"
              value={trainer?.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bemerkung
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Optional"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? 'Speichern...' : 'Speichern'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
