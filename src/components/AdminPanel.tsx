import { useState, useEffect } from 'react';
import type { Club, TrainingDay, Admin } from '../types';
import { getWeekdayName, formatTime } from '../utils/formatters';
import {
  createTrainingDay,
  deleteTrainingDay,
  deactivateTrainingDay,
  updateTrainingDay,
  getAllAdmins,
  createAdmin,
  deleteAdmin,
  deleteOverride,
  getOverridesByClub,
} from '../lib/supabaseService';
import { WEEKDAY_NAMES } from '../utils/formatters';
import { useAdmin } from '../context/AdminContext';
import AddExtraTrainingModal from './AddExtraTrainingModal';
import EditTrainingDayModal from './EditTrainingDayModal';
import EditExtraTrainingModal from './EditExtraTrainingModal';

interface AdminPanelProps {
  club: Club;
  trainingDays: TrainingDay[];
  onClose: () => void;
  onTrainingDayAdded: () => void;
}

export default function AdminPanel({
  club,
  trainingDays,
  onClose,
  onTrainingDayAdded,
}: AdminPanelProps) {
  const { isSuperAdmin, admin } = useAdmin();
  
  // Training Days State
  const [weekday, setWeekday] = useState(1);
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Admin Management State
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminIsSuperAdmin, setNewAdminIsSuperAdmin] = useState(false);
  const [isAdminFormLoading, setIsAdminFormLoading] = useState(false);
  
  // Collapsible Sections State
  const [isTrainingDaysOpen, setIsTrainingDaysOpen] = useState(true);
  const [isAdminManagementOpen, setIsAdminManagementOpen] = useState(false);
  
  // Extra Training Modal State
  const [showExtraTrainingModal, setShowExtraTrainingModal] = useState(false);
  
  // Edit Training Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [trainingDayToEdit, setTrainingDayToEdit] = useState<TrainingDay | null>(null);
  
  // Extra Trainings State
  const [extraTrainings, setExtraTrainings] = useState<any[]>([]);
  const [showEditExtraModal, setShowEditExtraModal] = useState(false);
  const [extraTrainingToEdit, setExtraTrainingToEdit] = useState<any>(null);
  
  useEffect(() => {
    loadExtraTrainings();
  }, [club.id]);
  
  const loadExtraTrainings = async () => {
    try {
      const overrides = await getOverridesByClub(club.id);
      const extras = overrides.filter(o => o.action === 'extra');
      setExtraTrainings(extras);
    } catch (error) {
      console.error('Error loading extra trainings:', error);
    }
  };
  
  useEffect(() => {
    if (isSuperAdmin) {
      loadAdmins();
    }
  }, [isSuperAdmin]);
  
  const loadAdmins = async () => {
    try {
      const data = await getAllAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

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
      alert('Trainingstag erfolgreich hinzugefügt');
    } catch (error) {
      console.error('Error adding training day:', error);
      alert('Fehler beim Hinzufügen des Trainingstags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrainingDay = async (id: number) => {
    if (!confirm('Möchten Sie diesen Trainingstag wirklich löschen?')) return;

    try {
      await deleteTrainingDay(id);
      onTrainingDayAdded();
      alert('Trainingstag gelöscht');
    } catch (error) {
      console.error('Error deleting training day:', error);
      alert('Fehler beim Löschen');
    }
  };
  
  const handleEditTrainingDay = (day: TrainingDay) => {
    setTrainingDayToEdit(day);
    setShowEditModal(true);
  };
  
  const handleUpdateTrainingDay = async (id: number, updates: { weekday: number; time_start: string; time_end?: string }) => {
    try {
      await updateTrainingDay(id, updates);
      onTrainingDayAdded();
      alert('Trainingstag aktualisiert');
    } catch (error) {
      console.error('Error updating training day:', error);
      throw error;
    }
  };
  
  const handleDeleteExtraTraining = async (id: number) => {
    if (!confirm('Möchten Sie dieses Extra-Training wirklich löschen?')) return;

    try {
      await deleteOverride(id);
      await loadExtraTrainings();
      onTrainingDayAdded();
      alert('Extra-Training gelöscht');
    } catch (error) {
      console.error('Error deleting extra training:', error);
      alert('Fehler beim Löschen');
    }
  };
  
  const handleEditExtraTraining = (extra: any) => {
    setExtraTrainingToEdit(extra);
    setShowEditExtraModal(true);
  };

  const handleDeactivateTrainingDay = async (id: number) => {
    if (!confirm('Möchten Sie diesen Trainingstag deaktivieren?')) return;

    try {
      await deactivateTrainingDay(id);
      onTrainingDayAdded();
      alert('Trainingstag deaktiviert');
    } catch (error) {
      console.error('Error deactivating training day:', error);
      alert('Fehler beim Deaktivieren');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername || !newAdminPassword) return;

    setIsAdminFormLoading(true);
    try {
      await createAdmin({
        username: newAdminUsername,
        password: newAdminPassword,
        email: newAdminEmail || undefined,
        full_name: newAdminName || undefined,
        is_super_admin: newAdminIsSuperAdmin,
        club_id: newAdminIsSuperAdmin ? undefined : club.id,
      });

      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminIsSuperAdmin(false);
      
      await loadAdmins();
      alert('Admin erfolgreich erstellt');
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Fehler beim Erstellen des Admins');
    } finally {
      setIsAdminFormLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: number, username: string) => {
    if (!confirm(`Admin "${username}" wirklich löschen?`)) return;

    try {
      await deleteAdmin(id);
      await loadAdmins();
      alert('Admin gelöscht');
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Fehler beim Löschen');
    }
  };

  const canManageAdmin = (_adminToManage: Admin) => {
    if (!admin) return false;
    // Super-Admin kann alle verwalten
    if (admin.is_super_admin) return true;
    // Club-Admin kann keine anderen Admins verwalten
    return false;
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-2xl shadow-2xl border border-blue-400/30">
      {/* Header */}
      <div className="flex justify-between items-center p-4 md:p-5 bg-blue-950/50 backdrop-blur-md border-b border-blue-400/30 rounded-t-2xl">
        <h2 className="text-lg md:text-xl font-bold text-white">⚙️ Admin-Panel</h2>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all active:scale-95"
        >
          ×
        </button>
      </div>

      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        {/* Training Days Section */}
        <div className="border border-white/20 rounded-xl overflow-hidden backdrop-blur-sm bg-white/5">
          <button
            onClick={() => setIsTrainingDaysOpen(!isTrainingDaysOpen)}
            className="w-full flex justify-between items-center p-3 md:p-4 hover:bg-white/10 transition-all active:scale-[0.99]"
          >
            <h3 className="text-base md:text-lg font-bold text-white">
              📅 Trainingstage verwalten
            </h3>
            <span className="text-2xl md:text-3xl text-white/80 font-bold">
              {isTrainingDaysOpen ? '−' : '+'}
            </span>
          </button>
          
          {isTrainingDaysOpen && (
            <div className="p-3 md:p-4 space-y-4 border-t border-white/20">
              {/* Add Training Day Form */}
              <div>
                <h4 className="text-sm md:text-base font-bold text-white mb-3">
                  ➕ Neuer Trainingstag
                </h4>
                <form onSubmit={handleAddTrainingDay} className="space-y-3">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-white mb-2">
                      Wochentag *
                    </label>
                    <select
                      value={weekday}
                      onChange={(e) => setWeekday(Number(e.target.value))}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
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
                      <label className="block text-xs md:text-sm font-semibold text-white mb-2">
                        Startzeit *
                      </label>
                      <input
                        type="time"
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                        required
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-white mb-2">
                        Endzeit
                      </label>
                      <input
                        type="time"
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
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
              <div className="border-t border-white/20 pt-4">
                <button
                  onClick={() => setShowExtraTrainingModal(true)}
                  className="w-full py-3 md:py-3.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all font-bold text-sm md:text-base shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>✨</span>
                  <span>Extra-Training hinzufügen</span>
                </button>
                <p className="text-xs text-white/70 mt-2 text-center">
                  Fügen Sie zusätzliche Trainingseinheiten für spezielle Anlässe hinzu
                </p>
              </div>

              {/* Existing Training Days */}
              <div>
                <h4 className="text-sm md:text-base font-bold text-white mb-3">
                  📋 Bestehende Trainingstage
                </h4>
                {trainingDays.length === 0 ? (
                  <p className="text-white/70 text-sm">Noch keine Trainingstage vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {trainingDays.map((day) => (
                      <div
                        key={day.id}
                        className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-white text-sm md:text-base">
                            {getWeekdayName(day.weekday)}
                          </div>
                          <div className="text-xs md:text-sm text-white/80 font-medium">
                            {formatTime(day.time_start)}
                            {day.time_end && ` - ${formatTime(day.time_end)}`}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleEditTrainingDay(day)}
                            className="px-3 py-2 bg-blue-500/80 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
                          >
                            ✏️ Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDeactivateTrainingDay(day.id)}
                            className="px-3 py-2 bg-yellow-500/80 hover:bg-yellow-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
                          >
                            ⏸ Deaktivieren
                          </button>
                          <button
                            onClick={() => handleDeleteTrainingDay(day.id)}
                            className="px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
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
                <div className="border-t border-white/20 pt-4">
                  <h4 className="text-sm md:text-base font-bold text-white mb-3">
                    ✨ Extra-Trainings ({extraTrainings.length})
                  </h4>
                  <div className="space-y-2">
                    {extraTrainings.map((extra) => (
                      <div
                        key={extra.id}
                        className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-3 p-3 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-400/30"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-white text-sm md:text-base">
                            {new Date(extra.override_date).toLocaleDateString('de-DE')} - {extra.time_start?.slice(0, 5)}
                            {extra.time_end && ` - ${extra.time_end.slice(0, 5)}`}
                          </div>
                          {extra.reason && (
                            <div className="text-xs md:text-sm text-white/80 font-medium">
                              {extra.reason}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditExtraTraining(extra)}
                            className="px-3 py-2 bg-blue-500/80 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
                          >
                            ✏️ Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDeleteExtraTraining(extra.id)}
                            className="px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
                          >
                            🗑 Löschen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Management Section - Only for Super Admins */}
        {isSuperAdmin && (
          <div className="border border-white/20 rounded-xl overflow-hidden backdrop-blur-sm bg-white/5">
            <button
              onClick={() => setIsAdminManagementOpen(!isAdminManagementOpen)}
              className="w-full flex justify-between items-center p-3 md:p-4 hover:bg-white/10 transition-all active:scale-[0.99]"
            >
              <h3 className="text-base md:text-lg font-bold text-white">
                👥 Admin-Verwaltung
              </h3>
              <span className="text-2xl md:text-3xl text-white/80 font-bold">
                {isAdminManagementOpen ? '−' : '+'}
              </span>
            </button>
            
            {isAdminManagementOpen && (
              <div className="p-3 md:p-4 space-y-4 border-t border-white/20">
                {/* Create Admin Form */}
                <div>
                  <h4 className="text-sm md:text-base font-bold text-white mb-3">
                    ➕ Neuen Admin erstellen
                  </h4>
                  <form onSubmit={handleCreateAdmin} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs md:text-sm font-semibold text-white mb-2">
                          Benutzername *
                        </label>
                        <input
                          type="text"
                          value={newAdminUsername}
                          onChange={(e) => setNewAdminUsername(e.target.value)}
                          required
                          className="w-full px-3 md:px-4 py-2 md:py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                          placeholder="username"
                        />
                      </div>

                      <div>
                        <label className="block text-xs md:text-sm font-semibold text-white mb-2">
                          Passwort *
                        </label>
                        <input
                          type="password"
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          required
                          className="w-full px-3 md:px-4 py-2 md:py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs md:text-sm font-semibold text-white mb-2">
                          E-Mail
                        </label>
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          className="w-full px-3 md:px-4 py-2 md:py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-xs md:text-sm font-semibold text-white mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          className="w-full px-3 md:px-4 py-2 md:py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                          placeholder="Max Mustermann"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/20">
                      <input
                        type="checkbox"
                        id="superadmin"
                        checked={newAdminIsSuperAdmin}
                        onChange={(e) => setNewAdminIsSuperAdmin(e.target.checked)}
                        className="h-5 w-5 text-blue-500 focus:ring-blue-400 border-white/30 rounded bg-white/10"
                      />
                      <label htmlFor="superadmin" className="block text-sm font-semibold text-white">
                        ⭐ Super-Admin (kann alle Vereine verwalten)
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isAdminFormLoading}
                      className="w-full py-3 md:py-3.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all font-bold text-sm md:text-base shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {isAdminFormLoading ? '⏳ Erstellen...' : '✓ Admin erstellen'}
                    </button>
                  </form>
                </div>

                {/* Existing Admins */}
                <div>
                  <h4 className="text-sm md:text-base font-bold text-white mb-3">
                    👥 Bestehende Admins ({admins.length})
                  </h4>
                  {admins.length === 0 ? (
                    <p className="text-white/70 text-sm">Keine Admins gefunden.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {admins.map((adminItem) => (
                        <div
                          key={adminItem.id}
                          className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                        >
                          <div className="flex-1">
                            <div className="font-bold text-white text-sm md:text-base flex flex-wrap items-center gap-2">
                              {adminItem.username}
                              {adminItem.is_super_admin && (
                                <span className="text-xs bg-blue-400/30 text-blue-200 px-2 py-1 rounded-lg font-semibold border border-blue-400/50">
                                  ⭐ Super-Admin
                                </span>
                              )}
                            </div>
                            <div className="text-xs md:text-sm text-white/80 font-medium mt-1">
                              {adminItem.full_name && <span>{adminItem.full_name}</span>}
                              {adminItem.email && <span className="ml-2">{adminItem.email}</span>}
                            </div>
                          </div>
                          {canManageAdmin(adminItem) && admin?.id !== adminItem.id && (
                            <button
                              onClick={() => handleDeleteAdmin(adminItem.id, adminItem.username)}
                              className="px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-md"
                            >
                              🗑 Löschen
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Extra Training Modal */}
      {showExtraTrainingModal && (
        <AddExtraTrainingModal
          clubId={club.id}
          onClose={() => setShowExtraTrainingModal(false)}
          onSuccess={() => {
            loadExtraTrainings();
            onTrainingDayAdded(); // Refresh calendar data
          }}
        />
      )}
      
      {/* Edit Training Day Modal */}
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
      
      {/* Edit Extra Training Modal */}
      {showEditExtraModal && extraTrainingToEdit && (
        <EditExtraTrainingModal
          extraTraining={extraTrainingToEdit}
          onClose={() => {
            setShowEditExtraModal(false);
            setExtraTrainingToEdit(null);
          }}
          onSuccess={() => {
            loadExtraTrainings();
            onTrainingDayAdded(); // Refresh calendar
          }}
        />
      )}
    </div>
  );
}
