import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Club, TrainingDay, TrainingEntry, TrainingSlot } from '../types';
import {
  getClubBySlug,
  getTrainingDaysByClub,
  getEntriesWithScheduledTrainers,
  getOverridesByClub,
} from '../lib/supabaseService';
import PublicTrainingCalendar from '../components/PublicTrainingCalendar';
import PublicDayModal from '../components/PublicDayModal';
import EventInfoModal from '../components/EventInfoModal';
import LoadingPage from '../components/LoadingPage';
import { calculateTrainingSlotsForMonth } from '../utils/calendarUtils';

/**
 * Öffentliche, schreibgeschützte Kalenderansicht für die Einbettung per <iframe>
 * auf den Vereins-Websites. Komplett getrennt von der internen Trainer-Ansicht:
 *  - keine Anmeldung, kein Admin, keine Bearbeitung
 *  - Coaches werden nur mit Initialen angezeigt
 *
 * Route: /public/:slug  (optional ?embed=1 blendet die Kopfzeile aus)
 */
export default function PublicClubPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';

  const [club, setClub] = useState<Club | null>(null);
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TrainingSlot[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TrainingSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const clubData = await getClubBySlug(slug);
        if (!clubData) {
          setNotFound(true);
          return;
        }
        setClub(clubData);

        const startDate = format(
          new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
          'yyyy-MM-dd'
        );
        const endDate = format(
          new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0),
          'yyyy-MM-dd'
        );

        const [days, allEntries, overridesData] = await Promise.all([
          getTrainingDaysByClub(clubData.id),
          getEntriesWithScheduledTrainers(clubData.id, startDate, endDate),
          getOverridesByClub(clubData.id, startDate, endDate),
        ]);

        setTrainingDays(days);
        setEntries(allEntries);
        setSlots(
          calculateTrainingSlotsForMonth(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            days,
            overridesData
          )
        );
      } catch (error) {
        console.error('Error loading public club data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, currentMonth]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (notFound || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kaisho-whiteSoft p-6">
        <div className="bg-white rounded-2xl p-8 border border-kaisho-greyLight shadow-md text-center">
          <p className="text-gray-500">Verein nicht gefunden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={isEmbed ? 'bg-transparent' : 'min-h-screen bg-kaisho-whiteSoft'}>
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-6xl">
        {!isEmbed && (
          <div className="mb-4 md:mb-6">
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-kaisho-greyLight shadow-md">
              <h1 className="text-2xl md:text-4xl font-bold text-kaisho-blue mb-1">
                {club.name}
              </h1>
              <p className="text-gray-500 text-sm md:text-base">
                {club.city} · Trainingskalender
              </p>
            </div>
          </div>
        )}

        {trainingDays.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 md:p-8 text-center border border-kaisho-greyLight shadow-md">
            <div className="text-gray-500 text-sm md:text-base">
              Noch keine Trainingstage konfiguriert.
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-3 md:p-6 border border-kaisho-greyLight shadow-md">
            <PublicTrainingCalendar
              currentDate={currentMonth}
              slots={slots}
              entries={entries}
              onDateClick={(date, dateSlots) => {
                if (dateSlots.length === 1 && dateSlots[0].isEvent) {
                  setSelectedEvent(dateSlots[0]);
                } else {
                  setSelectedDate(date);
                  setSelectedSlots(dateSlots);
                }
              }}
              onMonthChange={(date: Date) => setCurrentMonth(date)}
            />
          </div>
        )}
      </div>

      {/* Tages-Detail (schreibgeschützt) */}
      {selectedDate && selectedSlots.length > 0 && (
        <PublicDayModal
          date={selectedDate}
          slots={selectedSlots}
          entries={entries}
          onClose={() => {
            setSelectedDate(null);
            setSelectedSlots([]);
          }}
        />
      )}

      {/* Event-Info */}
      {selectedEvent && (
        <EventInfoModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
