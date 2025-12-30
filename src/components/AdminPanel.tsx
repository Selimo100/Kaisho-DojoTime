import { useState, useEffect, useMemo } from 'react';
import type { Club, TrainingDay, Admin, Trainer } from '../types';
import { getWeekdayName, formatTime, WEEKDAY_NAMES } from '../utils/formatters';
import {
  createTrainingDay,
  deleteTrainingDay,
  deactivateTrainingDay,
  updateTrainingDay,
  getAllAdmins,
  deleteAdmin,
  deleteOverride,
  getOverridesByClub,
  getAllTrainers,
  promoteTrainerToAdmin,
  deleteTrainer,
} from '../lib/supabaseService';
import { useAdmin } from '../context/AdminContext';
import AddExtraTrainingModal from './AddExtraTrainingModal';
import EditTrainingDayModal from './EditTrainingDayModal';
import EditExtraTrainingModal from './EditExtraTrainingModal';
import CreateTrainerModal from './CreateTrainerModal';

interface AdminPanelProps {
  club: Club;
  trainingDays: TrainingDay[];
  onClose: () => void;
  onTrainingDayAdded: () => void;
}

interface MergedUser {
  id: string; // Composite ID or main ID
  email: string;
  name: string;
  trainerId?: string;
  adminId?: number;
  isSuperAdmin: boolean;
  isTrainer: boolean;
  isAdmin: boolean;
  clubId?: string;
  username?: string; // For admins
}

export default function AdminPanel({
  club,
  trainingDays,
  onClose,
  onTrainingDayAdded,
}: AdminPanelProps) {
  const { isSuperAdmin, admin } = useAdmin();
  const [activeTab, setActiveTab] = useState<'schedule' | 'users'>('schedule');
  
  // Training Days State
  const [weekday, setWeekday] = useState(1);
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data State
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Extra Trainings State
  const [extraTrainings, setExtraTrainings] = useState<any[]>([]);
  const [isExtraTrainingsOpen, setIsExtraTrainingsOpen] = useState(false);
  
  // Modals State
  const [showCreateTrainerModal, setShowCreateTrainerModal] = useState(false);
  const [showExtraTrainingModal, setShowExtraTrainingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [trainingDayToEdit, setTrainingDayToEdit] = useState<TrainingDay | null>(null);
  const [showEditExtraModal, setShowEditExtraModal] = useState(false);
  const [extraTrainingToEdit, setExtraTrainingToEdit] = useState<any>(null);

  useEffect(() => {
    loadExtraTrainings();
    if (isSuperAdmin) {
      loadData();
    }
  }, [club.id, isSuperAdmin]);
  
  const loadExtraTrainings = async () => {
    try {
      const overrides = await getOverridesByClub(club.id);
      const extras = overrides.filter(o => o.action === 'extra');
      setExtraTrainings(extras);
    } catch (error) {
      console.error('Error loading extra trainings:', error);
    }
  };
  
  const loadData = async () => {
    setLoadingData(true);
    try {
      const [adminsData, trainersData] = await Promise.all([
        getAllAdmins(),
        getAllTrainers()
      ]);
      setAdmins(adminsData);
      setTrainers(trainersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const mergedUsers = useMemo(() => {
    const userMap = new Map<string, MergedUser>();

    // Add Trainers
    trainers.forEach(t => {
      if (!t.email) return;
      userMap.set(t.email.toLowerCase(), {
        id: `trainer-${t.id}`,
        email: t.email,
        name: t.name,
        trainerId: t.id,
        isTrainer: true,
        isAdmin: false,
        isSuperAdmin: false,
        clubId: t.club_id
      });
    });

    // Merge Admins
    admins.forEach(a => {
      const emailKey = a.email?.toLowerCase();
      if (emailKey && userMap.has(emailKey)) {
        const user = userMap.get(emailKey)!;
        user.adminId = a.id;
        user.isAdmin = true;
        user.isSuperAdmin = a.is_super_admin;
        user.username = a.username;
      } else {
        // Standalone Admin
        userMap.set(emailKey || `admin-${a.id}`, {
          id: `admin-${a.id}`,
          email: a.email || '',
          name: a.full_name || a.username,
          adminId: a.id,
          isTrainer: false,
          isAdmin: true,
          isSuperAdmin: a.is_super_admin,
          clubId: a.club_id,
          username: a.username
        });
      }
    });

    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [admins, trainers]);

  // ... Handlers for Training Days (keep existing) ...
  const handleAddTrainingDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeStart) return;
    setIsLoading(true);
    try {
      await createTrainingDay({
        club_id: club.id,
        weekday,
        time_start: timeStart,
        time_end: timeEnd || undefined,
      });
      setWeekday(1);
      setTimeStart('');
      setTimeEnd('');
      onTrainingDayAdded();
    } catch (error) {
      console.error('Error adding training day:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrainingDay = async (id: number) => {
    try {
      await deleteTrainingDay(id);
      onTrainingDayAdded();
    } catch (error) {
      console.error('Error deleting training day:', error);
    }
  };

  const handleDeactivateTrainingDay = async (id: number) => {
    try {
      await deactivateTrainingDay(id);
      onTrainingDayAdded();
    } catch (error) {
      console.error('Error deactivating training day:', error);
    }
  };

  const handleUpdateTrainingDay = async (id: number, updates: { weekday: number; time_start: string; time_end?: string }) => {
    try {
      await updateTrainingDay(id, updates);
      onTrainingDayAdded();
    } catch (error) {
      console.error('Error updating training day:', error);
      throw error;
    }
  };

  // ... Handlers for Extra Trainings (keep existing) ...
  const handleDeleteExtraTraining = async (id: number) => {
    try {
      await deleteOverride(id);
      await loadExtraTrainings();
      onTrainingDayAdded();
    } catch (error) {
      console.error('Error deleting extra training:', error);
    }
  };

  // ... User Management Handlers ...

  const handlePromoteUser = async (user: MergedUser, asSuperAdmin: boolean) => {
    if (!user.trainerId) return;
    try {
      // Find the trainer object
      const trainer = trainers.find(t => t.id === user.trainerId);
      if (!trainer) return;

      await promoteTrainerToAdmin({ trainer, isSuperAdmin: asSuperAdmin });
      await loadData();
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  };

  const handleRevokeAdmin = async (user: MergedUser) => {
    if (!user.adminId) return;
    if (confirm(`Möchten Sie wirklich die Admin-Rechte von ${user.name} entfernen?`)) {
      try {
        await deleteAdmin(user.adminId);
        await loadData();
      } catch (error) {
        console.error('Error revoking admin rights:', error);
      }
    }
  };

  const handleDeleteUser = async (user: MergedUser) => {
    if (!confirm(`Möchten Sie den Benutzer ${user.name} wirklich komplett löschen? Dies kann nicht rückgängig gemacht werden.`)) return;
    
    try {
      // Delete Admin if exists
      if (user.adminId) {
        await deleteAdmin(user.adminId);
      }
      // Delete Trainer if exists
      if (user.trainerId) {
        await deleteTrainer(user.trainerId);
      }
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-kaisho-greyLight flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex justify-between items-center p-4 md:p-5 bg-kaisho-blueIce border-b border-kaisho-greyLight rounded-t-2xl flex-shrink-0">
        <h2 className="text-lg md:text-xl font-bold text-kaisho-blue">⚙️ Admin-Panel</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-kaisho-blue text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-all active:scale-95"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-kaisho-greyLight bg-gray-50 flex-shrink-0">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-3 text-sm md:text-base font-bold transition-colors ${
            activeTab === 'schedule'
              ? 'bg-white text-kaisho-blue border-b-2 border-kaisho-blue'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          📅 Trainingszeiten
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm md:text-base font-bold transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-kaisho-blue border-b-2 border-kaisho-blue'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            👥 Benutzerverwaltung
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === 'schedule' ? (
          <div className="space-y-6">
            {/* Add Training Day Form */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm md:text-base font-bold text-kaisho-blue mb-3">
                ➕ Neuer Trainingstag
              </h4>
              <form onSubmit={handleAddTrainingDay} className="space-y-3">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Wochentag *
                  </label>
                  <select
                    value={weekday}
                    onChange={(e) => setWeekday(Number(e.target.value))}
                    required
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-white border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
                  >
                    {WEEKDAY_NAMES.map((name, index) => (
                      <option key={index} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                      Startzeit *
                    </label>
                    <input
                      type="time"
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-white border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                      Endzeit
                    </label>
                    <input
                      type="time"
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-white border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 md:py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all font-bold text-sm md:text-base shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? '⏳ Hinzufügen...' : '✓ Trainingstag hinzufügen'}
                </button>
              </form>
            </div>

            {/* Extra Training Button */}
            <div>
              <button
                onClick={() => setShowExtraTrainingModal(true)}
                className="w-full py-3 md:py-3.5 px-4 bg-gradient-to-r from-kaisho-blueLight to-kaisho-blue hover:from-kaisho-blue hover:to-kaisho-blueLight text-white rounded-xl transition-all font-bold text-sm md:text-base shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <span>✨</span>
                <span>Extra-Training hinzufügen</span>
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Fügen Sie zusätzliche Trainingseinheiten für spezielle Anlässe hinzu
              </p>
            </div>

            {/* Existing Training Days */}
            <div>
              <h4 className="text-sm md:text-base font-bold text-kaisho-blue mb-3">
                📋 Bestehende Trainingstage
              </h4>
              {trainingDays.length === 0 ? (
                <p className="text-gray-500 text-sm">Noch keine Trainingstage vorhanden.</p>
              ) : (
                <div className="space-y-2">
                  {trainingDays.map((day) => (
                    <div
                      key={day.id}
                      className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 text-sm md:text-base">
                          {getWeekdayName(day.weekday)}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 font-medium">
                          {formatTime(day.time_start)}
                          {day.time_end && ` - ${formatTime(day.time_end)}`}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setTrainingDayToEdit(day);
                            setShowEditModal(true);
                          }}
                          className="px-3 py-2 bg-kaisho-blueLight hover:bg-kaisho-blue text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
                        >
                          ✏️ Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDeactivateTrainingDay(day.id)}
                          className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
                        >
                          ⏸ Deaktivieren
                        </button>
                        <button
                          onClick={() => handleDeleteTrainingDay(day.id)}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
                        >
                          🗑 Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extra Trainings List */}
            {extraTrainings.length > 0 && (
              <div className="border-t border-kaisho-greyLight pt-4">
                <button
                  onClick={() => setIsExtraTrainingsOpen(!isExtraTrainingsOpen)}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-kaisho-blueIce rounded-xl hover:from-purple-100 hover:to-kaisho-blueIce/80 transition-all border border-purple-200"
                >
                  <span className="text-sm md:text-base font-bold text-purple-700">
                    ✨ Extra-Trainings ({extraTrainings.length})
                  </span>
                  <span className="text-2xl text-purple-600 transition-transform duration-200" style={{ transform: isExtraTrainingsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>
                
                {isExtraTrainingsOpen && (
                  <div className="space-y-2 mt-3">
                    {extraTrainings.map((extra) => (
                      <div
                        key={extra.id}
                        className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-3 p-3 bg-kaisho-blueIce rounded-xl border border-kaisho-blueLight/30"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-kaisho-blue text-sm md:text-base">
                            {new Date(extra.override_date).toLocaleDateString('de-DE')} - {extra.time_start?.slice(0, 5)}
                            {extra.time_end && ` - ${extra.time_end.slice(0, 5)}`}
                          </div>
                          {extra.reason && (
                            <div className="text-xs md:text-sm text-gray-600 font-medium">
                              {extra.reason}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setExtraTrainingToEdit(extra);
                              setShowEditExtraModal(true);
                            }}
                            className="px-3 py-2 bg-kaisho-blueLight hover:bg-kaisho-blue text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteExtraTraining(extra.id)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Management Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
              <h3 className="text-lg font-bold text-kaisho-blue">
                Benutzer ({mergedUsers.length})
              </h3>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowCreateTrainerModal(true)}
                  className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <span>➕</span> Trainer anlegen
                </button>
              </div>
            </div>

            {/* Users List */}
            {loadingData ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-kaisho-blue border-t-transparent"></div>
                <p className="text-gray-500 mt-2">Lade Benutzer...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mergedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-800 text-lg">{user.name}</h4>
                        {user.isSuperAdmin && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                            Super Admin
                          </span>
                        )}
                        {user.isAdmin && !user.isSuperAdmin && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                            Admin
                          </span>
                        )}
                        {user.isTrainer && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                            Trainer
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {user.email || user.username || 'Keine E-Mail'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Actions */}
                      {!user.isAdmin && user.isTrainer && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handlePromoteUser(user, false)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Zum Admin machen
                          </button>
                          <button
                            onClick={() => handlePromoteUser(user, true)}
                            className="px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Zum Super-Admin
                          </button>
                        </div>
                      )}

                      {user.isAdmin && (
                        <button
                          onClick={() => handleRevokeAdmin(user)}
                          className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-xs font-semibold transition-colors"
                          title="Admin-Rechte entfernen (Benutzer bleibt Trainer)"
                        >
                          Admin-Rechte entziehen
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
                        title="Benutzer komplett löschen"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showExtraTrainingModal && (
        <AddExtraTrainingModal
          clubId={club.id}
          onClose={() => setShowExtraTrainingModal(false)}
          onSuccess={() => {
            loadExtraTrainings();
            onTrainingDayAdded();
          }}
        />
      )}
      
      {showEditModal && trainingDayToEdit && (
        <EditTrainingDayModal
          trainingDay={trainingDayToEdit}
          onClose={() => {
            setShowEditModal(false);
            setTrainingDayToEdit(null);
          }}
          onSave={handleUpdateTrainingDay}
        />
      )}
      
      {showEditExtraModal && extraTrainingToEdit && (
        <EditExtraTrainingModal
          extraTraining={extraTrainingToEdit}
          onClose={() => {
            setShowEditExtraModal(false);
            setExtraTrainingToEdit(null);
          }}
          onSuccess={() => {
            loadExtraTrainings();
            onTrainingDayAdded();
          }}
        />
      )}
      
      {showCreateTrainerModal && (
        <CreateTrainerModal
          clubId={club.id}
          clubName={club.name}
          trainingDays={trainingDays}
          adminId={admin?.id}
          onClose={() => setShowCreateTrainerModal(false)}
          onSuccess={() => {
            loadData();
            onTrainingDayAdded();
          }}
        />
      )}
    </div>
  );
}
