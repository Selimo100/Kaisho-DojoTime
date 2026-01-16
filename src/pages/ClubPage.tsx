import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Club, TrainingDay, TrainingEntry, TrainingSlot } from '../types';
import {
  getClubBySlug,
  getTrainingDaysByClub,
  getEntriesWithScheduledTrainers,
  getOverridesByClub,
} from '../lib/supabaseService';
import TrainingCalendar from '../components/TrainingCalendar';
import TrainingDayModal from '../components/TrainingDayModal';
import AdminPanel from '../components/AdminPanel';
import AuthModal from '../components/AuthModal';
import LoadingPage from '../components/LoadingPage';
import QuickEventModal from '../components/QuickEventModal';
import EventInfoModal from '../components/EventInfoModal';
import TrainerProfileModal from '../components/TrainerProfileModal';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { calculateTrainingSlotsForMonth } from '../utils/calendarUtils';

export default function ClubPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { trainer, logout } = useAuth();
  const { admin, logoutAdmin } = useAdmin();

  // Vollständiger Logout: Trainer und Admin komplett ausloggen
  const handleFullLogout = () => {
    logout();
    logoutAdmin();
  };

  const [club, setClub] = useState<Club | null>(null);
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TrainingSlot[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TrainingSlot | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQuickEventModal, setShowQuickEventModal] = useState(false);
  const [quickEventDate, setQuickEventDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const clubData = await getClubBySlug(slug);
        if (!clubData) {
          navigate('/');
          return;
        }

        setClub(clubData);

        // Lade Daten für aktuellen Monat plus 1 Monat vorher und nachher
        const startDate = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1), 'yyyy-MM-dd');
        const endDate = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0), 'yyyy-MM-dd');

        const [days, allEntries, overridesData] = await Promise.all([
          getTrainingDaysByClub(clubData.id),
          getEntriesWithScheduledTrainers(clubData.id, startDate, endDate),
          getOverridesByClub(clubData.id, startDate, endDate),
        ]);

        setTrainingDays(days);
        setEntries(allEntries);
        setOverrides(overridesData);

        // Calculate slots for current month
        const calculatedSlots = calculateTrainingSlotsForMonth(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          days,
          overridesData
        );
        setSlots(calculatedSlots);
      } catch (error) {
        console.error('Error loading club data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, navigate, currentMonth]);

  const handleRefreshEntries = async () => {
    if (!club) return;
    try {
      const startDate = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1), 'yyyy-MM-dd');
      const endDate = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0), 'yyyy-MM-dd');
      const allEntries = await getEntriesWithScheduledTrainers(club.id, startDate, endDate);
      console.log('ClubPage: Loaded entries:', allEntries.length, allEntries);
      setEntries(allEntries);
    } catch (error) {
      console.error('Error refreshing entries:', error);
    }
  };

  const handleRefreshTrainingDays = async () => {
    if (!club) return;
    try {
      // Refresh training days AND overrides
      const [days, overridesData] = await Promise.all([
        getTrainingDaysByClub(club.id),
        getOverridesByClub(club.id)
      ]);
      setTrainingDays(days);
      setOverrides(overridesData);
      
      // Recalculate slots with updated data
      const calculatedSlots = calculateTrainingSlotsForMonth(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        days,
        overridesData
      );
      setSlots(calculatedSlots);
    } catch (error) {
      console.error('Error refreshing training days:', error);
    }
  };

  const canAdminManageClub = () => {
    if (!admin) return false;
    // Super-Admin kann alle Clubs verwalten
    if (admin.is_super_admin) return true;
    // Club-Admin kann nur seinen Club verwalten
    return admin.club_id === club?.id;
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!club) {
    return null;
  }

  return (
    <div className="min-h-screen bg-kaisho-whiteSoft">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-6xl">
        {/* Mobile-First Header */}
        <div className="mb-4 md:mb-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="text-kaisho-blue hover:text-kaisho-blueLight mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base 
                     bg-white px-3 py-2 rounded-lg hover:bg-kaisho-blueIce transition-all border border-kaisho-greyLight shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück
          </button>

          {/* Club Info Card */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-kaisho-greyLight shadow-md">
            <h1 className="text-2xl md:text-4xl font-bold text-kaisho-blue mb-1">
              {club.name}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">{club.city}</p>
          </div>
        </div>

        {/* Auth Status Bar - Unified & Clean */}
        <div className="mb-4">
          {trainer ? (
            <div className="bg-white rounded-xl p-3 md:p-4 border border-kaisho-greyLight shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-kaisho-blue to-kaisho-blueLight rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg">
                      {trainer.name.charAt(0).toUpperCase()}
                    </div>
                    {admin && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-xs">👑</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm md:text-base">{trainer.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Trainer</span>
                      {admin && (
                        <>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-amber-600 font-medium">
                            {admin.is_super_admin ? 'Super-Admin' : 'Admin'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="bg-gradient-to-r from-kaisho-blue to-kaisho-blueLight hover:from-kaisho-blueLight hover:to-kaisho-blue text-white px-5 py-2 rounded-lg transition-all font-medium shadow-md flex items-center gap-2 active:scale-95"
                  >
                    <span>👤</span>
                    <span>Mein Profil</span>
                  </button>
                  <button
                    onClick={handleFullLogout}
                    className="text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-all font-medium border border-red-100 shadow-sm"
                  >
                    Abmelden
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-gradient-to-r from-kaisho-blue to-kaisho-blueLight hover:from-kaisho-blueLight hover:to-kaisho-blue text-white rounded-xl p-4 
                       flex items-center justify-between transition-all shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm md:text-base">Anmelden / Registrieren</p>
                  <p className="text-xs text-white/80">Um Trainingseinträge zu sehen und zu erstellen</p>
                </div>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Admin Panel Toggle - Only shown if user is admin */}
        {admin && canAdminManageClub() && (
          <div className="mb-4">
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="w-full bg-white text-kaisho-blue rounded-xl p-3 
                       hover:bg-kaisho-blueIce transition-all border border-kaisho-greyLight shadow-sm flex items-center justify-between"
            >
              <span className="text-sm md:text-base font-medium flex items-center gap-2">
                {showAdminPanel ? '📁 Admin-Panel schliessen' : '⚙️ Admin-Panel öffnen'}
              </span>
              <svg 
                className={`w-5 h-5 transition-transform ${showAdminPanel ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Admin Panel - Collapsible */}
        {admin && canAdminManageClub() && showAdminPanel && (
          <div className="mb-4">
            <AdminPanel
              club={club}
              trainingDays={trainingDays}
              onClose={() => setShowAdminPanel(false)}
              onTrainingDayAdded={handleRefreshTrainingDays}
            />
          </div>
        )}

        {/* Training Calendar - Mobile First */}
        {trainingDays.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 md:p-8 text-center border border-kaisho-greyLight shadow-md">
            <div className="text-gray-500 text-sm md:text-base">
              Noch keine Trainingstage konfiguriert.
              {admin && canAdminManageClub() && ' Nutzen Sie das Admin-Panel oben.'}
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="bg-white rounded-2xl p-3 md:p-6 border border-kaisho-greyLight shadow-md">
              <TrainingCalendar
                currentDate={currentMonth}
                slots={slots}
                entries={entries}
                onDateClick={(date, dateSlots) => {
                  // Wenn nur ein Event (und kein Training), zeige EventInfoModal
                  if (dateSlots.length === 1 && dateSlots[0].isEvent) {
                    setSelectedEvent(dateSlots[0]);
                  } else {
                    // Sonst zeige TrainingDayModal (filtert Events automatisch)
                    setSelectedDate(date);
                    setSelectedSlots(dateSlots);
                  }
                }}
                onMonthChange={(date: Date) => {
                  setCurrentMonth(date);
                }}
              />
            </div>
            
            {/* Floating Event Button - Only for Admins */}
            {admin && canAdminManageClub() && (
              <div className="fixed bottom-6 right-6 z-40">
                <button
                  onClick={() => {
                    setQuickEventDate(new Date());
                    setShowQuickEventModal(true);
                  }}
                  className="group relative px-4 py-3 bg-sky-400 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="text-lg">📅</span>
                  <span className="hidden sm:inline text-sm">Event</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Event erstellen
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Training Day Modal */}
      {selectedDate && selectedSlots.length > 0 && club && (
        <TrainingDayModal
          date={selectedDate}
          slots={selectedSlots}
          entries={entries.filter((e) => {
            // Filter entries for selected date
            const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
            if (e.training_date !== selectedDateStr) return false;
            
            // Check if entry matches any slot (regular or extra training)
            return selectedSlots.some((slot) => {
              if (slot.isExtra && slot.overrideId) {
                // Extra-Training: match by override_id
                return e.override_id === slot.overrideId;
              } else {
                // Regular Training: match by training_day_id
                return e.training_day_id === slot.trainingDayId;
              }
            });
          })}
          clubId={club.id}
          isAdmin={!!(admin && canAdminManageClub())}
          onClose={() => {
            setSelectedDate(null);
            setSelectedSlots([]);
          }}
          onEntryAdded={async () => {
            // Refresh all data including overrides after entry/cancellation
            handleRefreshEntries();
            if (club) {
              const [days, overridesData] = await Promise.all([
                getTrainingDaysByClub(club.id),
                getOverridesByClub(club.id),
              ]);
              setTrainingDays(days);
              setOverrides(overridesData);
              
              const calculatedSlots = calculateTrainingSlotsForMonth(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                days,
                overridesData
              );
              setSlots(calculatedSlots);
            }
          }}
          onAuthRequired={() => setShowAuthModal(true)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && club && (
        <AuthModal
          clubId={club.id}
          clubName={club.name}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Quick Event Modal */}
      {showQuickEventModal && quickEventDate && club && (
        <QuickEventModal
          clubId={club.id}
          date={quickEventDate}
          onClose={() => {
            setShowQuickEventModal(false);
            setQuickEventDate(null);
          }}
          onSuccess={async () => {
            // Refresh calendar data
            await handleRefreshTrainingDays();
            handleRefreshEntries();
          }}
        />
      )}

      {/* Trainer Profile Modal */}
      {showProfileModal && trainer && club && (
        <TrainerProfileModal
          clubId={club.id}
          entries={entries}
          trainingDays={trainingDays}
          overrides={overrides}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Event Info Modal */}
      {selectedEvent && (
        <EventInfoModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
