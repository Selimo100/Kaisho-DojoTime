import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Club, TrainingDay, TrainingEntry, TrainingSlot } from '../types';
import {
  getClubBySlug,
  getTrainingDaysByClub,
  getEntriesByClubAndDay,
  getOverridesByClub,
} from '../lib/supabaseService';
import TrainingCalendar from '../components/TrainingCalendar';
import TrainingDayModal from '../components/TrainingDayModal';
import AdminPanel from '../components/AdminPanel';
import AdminLoginModal from '../components/AdminLoginModal';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { calculateTrainingSlotsForMonth } from '../utils/calendarUtils';

export default function ClubPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { trainer, logout } = useAuth();
  const { admin, logoutAdmin } = useAdmin();

  const [club, setClub] = useState<Club | null>(null);
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [, setOverrides] = useState<any[]>([]);
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TrainingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

        const [days, allEntries, overridesData] = await Promise.all([
          getTrainingDaysByClub(clubData.id),
          getEntriesByClubAndDay(clubData.id),
          getOverridesByClub(clubData.id),
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
      const allEntries = await getEntriesByClubAndDay(club.id);
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Laden...</div>
      </div>
    );
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

        {/* Auth Status Bar - Mobile Optimized */}
        <div className="mb-4 space-y-2">
          {/* Trainer Info */}
          {trainer && (
            <div className="bg-emerald-50 rounded-xl p-3 md:p-4 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                    {trainer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Angemeldet als Trainer:</p>
                    <p className="font-medium text-gray-800 text-sm md:text-base">{trainer.name}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="text-xs md:text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
                >
                  Abmelden
                </button>
              </div>
            </div>
          )}

          {/* Guest Prompt */}
          {!trainer && (
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

        {/* Admin Section - Mobile Optimized */}
        <div className="mb-4 space-y-2">
          {!admin ? (
            <button
              onClick={() => setShowAdminLoginModal(true)}
              className="w-full bg-white text-kaisho-blue rounded-xl p-3 md:p-4 
                       hover:bg-kaisho-blueIce transition-all border border-kaisho-greyLight shadow-sm flex items-center justify-between"
            >
              <span className="flex items-center gap-2 text-sm md:text-base">
                🔐 <span>Als Admin anmelden</span>
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="bg-kaisho-blueIce rounded-xl p-3 md:p-4 border border-kaisho-blueLight/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-kaisho-blueLight rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {admin.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Admin:</p>
                      <p className="font-medium text-gray-800 text-sm">{admin.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={logoutAdmin}
                    className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-all"
                  >
                    Abmelden
                  </button>
                </div>
                {admin.is_super_admin && (
                  <span className="inline-block text-xs bg-kaisho-blueLight/20 text-kaisho-blue px-2 py-1 rounded border border-kaisho-blueLight/30 font-medium">
                    Super-Admin
                  </span>
                )}
              </div>
              
              {canAdminManageClub() && (
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className="w-full bg-white text-kaisho-blue rounded-xl p-3 
                           hover:bg-kaisho-blueIce transition-all border border-kaisho-greyLight shadow-sm flex items-center justify-between"
                >
                  <span className="text-sm md:text-base font-medium">
                    {showAdminPanel ? '📁 Panel schliessen' : '⚙️ Admin-Panel öffnen'}
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
              )}
            </div>
          )}
        </div>

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
          <div className="bg-white rounded-2xl p-3 md:p-6 border border-kaisho-greyLight shadow-md">
            <TrainingCalendar
              currentDate={currentMonth}
              slots={slots}
              entries={entries}
              onDateClick={(date, dateSlots) => {
                setSelectedDate(date);
                setSelectedSlots(dateSlots);
              }}
              onMonthChange={(date: Date) => {
                setCurrentMonth(date);
              }}
            />
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
            return selectedSlots.some((slot) => 
              slot.date === selectedDateStr && slot.trainingDayId === e.training_day_id
            );
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

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <AdminLoginModal
          onClose={() => setShowAdminLoginModal(false)}
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
    </div>
  );
}
