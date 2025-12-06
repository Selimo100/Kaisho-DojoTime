import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TrainingSlot } from '../types';

interface EventInfoModalProps {
  event: TrainingSlot;
  onClose: () => void;
}

export default function EventInfoModal({ event, onClose }: EventInfoModalProps) {
  const eventDate = new Date(event.date);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-400 to-sky-500 p-6 flex justify-between items-center rounded-t-2xl">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>📅</span>
              <span>Event Info</span>
            </h2>
            <p className="text-white/90 text-sm mt-1">
              {format(eventDate, 'EEEE, d. MMMM yyyy', { locale: de })}
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
        <div className="p-6 space-y-6">
          {/* Event Details Card */}
          <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl p-5 border-2 border-sky-200">
            <div className="space-y-4">
              {/* Event Name/Reason */}
              {event.reason && (
                <div>
                  <div className="text-xs font-semibold text-sky-600 mb-1">EVENT</div>
                  <div className="text-2xl font-bold text-sky-900">
                    {event.reason}
                  </div>
                </div>
              )}

              {/* Time */}
              <div className="flex items-center gap-4 pt-3 border-t border-sky-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🕐</span>
                  <div>
                    <div className="text-xs font-semibold text-sky-600">UHRZEIT</div>
                    <div className="text-lg font-bold text-sky-900">
                      {event.timeStart.slice(0, 5)}
                      {event.timeEnd && ` - ${event.timeEnd.slice(0, 5)}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Badge */}
              <div className="flex items-center gap-2 pt-3 border-t border-sky-200">
                <span className="text-2xl">📆</span>
                <div>
                  <div className="text-xs font-semibold text-sky-600">DATUM</div>
                  <div className="text-lg font-bold text-sky-900">
                    {format(eventDate, 'EEEE, d. MMMM yyyy', { locale: de })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-sky-400 hover:bg-sky-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
