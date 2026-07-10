import { useState, useEffect, useMemo } from 'react';
import {
  X,
  CalendarDays,
  Users,
  Plus,
  Pencil,
  Trash2,
  PauseCircle,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import type { Club, TrainingDay, Admin, Trainer } from '../types';
import { getWeekdayName, formatTime } from '../utils/formatters';
import {
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
import Button from './ui/Button';
import Badge from './ui/Badge';
import AddTrainingDayModal from './AddTrainingDayModal';
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
  id: string;
  email: string;
  name: string;
  trainerId?: string;
  adminId?: number;
  isSuperAdmin: boolean;
  isTrainer: boolean;
  isAdmin: boolean;
  clubId?: string;
  username?: string;
}

export default function AdminPanel({
  club,
  trainingDays,
  onClose,
  onTrainingDayAdded,
}: AdminPanelProps) {
  const { isSuperAdmin, admin } = useAdmin();
  const [activeTab, setActiveTab] = useState<'schedule' | 'users'>('schedule');

  // Data State
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Extra Trainings State
  const [extraTrainings, setExtraTrainings] = useState<any[]>([]);
  const [isExtraTrainingsOpen, setIsExtraTrainingsOpen] = useState(false);

  // Modals State
  const [showAddTrainingDayModal, setShowAddTrainingDayModal] = useState(false);
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
      setExtraTrainings(overrides.filter((o) => o.action === 'extra'));
    } catch (error) {
      console.error('Error loading extra trainings:', error);
    }
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [adminsData, trainersData] = await Promise.all([getAllAdmins(), getAllTrainers()]);
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

    trainers.forEach((t) => {
      if (!t.email) return;
      userMap.set(t.email.toLowerCase(), {
        id: `trainer-${t.id}`,
        email: t.email,
        name: t.name,
        trainerId: t.id,
        isTrainer: true,
        isAdmin: false,
        isSuperAdmin: false,
        clubId: t.club_id,
      });
    });

    admins.forEach((a) => {
      const emailKey = a.email?.toLowerCase();
      if (emailKey && userMap.has(emailKey)) {
        const user = userMap.get(emailKey)!;
        user.adminId = a.id;
        user.isAdmin = true;
        user.isSuperAdmin = a.is_super_admin;
        user.username = a.username;
      } else {
        userMap.set(emailKey || `admin-${a.id}`, {
          id: `admin-${a.id}`,
          email: a.email || '',
          name: a.full_name || a.username,
          adminId: a.id,
          isTrainer: false,
          isAdmin: true,
          isSuperAdmin: a.is_super_admin,
          clubId: a.club_id,
          username: a.username,
        });
      }
    });

    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [admins, trainers]);

  const handleDeleteTrainingDay = async (id: number) => {
    if (!confirm('Diesen Trainingstag wirklich löschen?')) return;
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

  const handleUpdateTrainingDay = async (
    id: number,
    updates: { weekday: number; time_start: string; time_end?: string; name?: string | null }
  ) => {
    try {
      await updateTrainingDay(id, updates);
      onTrainingDayAdded();
    } catch (error) {
      console.error('Error updating training day:', error);
      throw error;
    }
  };

  const handleDeleteExtraTraining = async (id: number) => {
    if (!confirm('Dieses Extra-Training wirklich löschen?')) return;
    try {
      await deleteOverride(id);
      await loadExtraTrainings();
      onTrainingDayAdded();
    } catch (error) {
      console.error('Error deleting extra training:', error);
    }
  };

  const handlePromoteUser = async (user: MergedUser, asSuperAdmin: boolean) => {
    if (!user.trainerId) return;
    try {
      const trainer = trainers.find((t) => t.id === user.trainerId);
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
    if (
      !confirm(
        `Möchten Sie den Benutzer ${user.name} wirklich komplett löschen? Dies kann nicht rückgängig gemacht werden.`
      )
    )
      return;
    try {
      if (user.adminId) await deleteAdmin(user.adminId);
      if (user.trainerId) await deleteTrainer(user.trainerId);
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const tabClass = (active: boolean) =>
    `flex items-center justify-center gap-2 flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
      active
        ? 'text-kaisho-blue border-kaisho-blue'
        : 'text-gray-500 border-transparent hover:text-gray-700'
    }`;

  return (
    <div className="bg-white rounded-xl shadow-md border border-kaisho-greyLight flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b border-kaisho-greyLight flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">Admin-Bereich</h2>
        <button
          onClick={onClose}
          aria-label="Schliessen"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-kaisho-greyLight flex-shrink-0 px-2">
        <button onClick={() => setActiveTab('schedule')} className={tabClass(activeTab === 'schedule')}>
          <CalendarDays className="w-4 h-4" />
          Trainingszeiten
        </button>
        {isSuperAdmin && (
          <button onClick={() => setActiveTab('users')} className={tabClass(activeTab === 'users')}>
            <Users className="w-4 h-4" />
            Benutzer
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'schedule' ? (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setShowAddTrainingDayModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Trainingstag hinzufügen
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowExtraTrainingModal(true)}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Extra-Training
              </Button>
            </div>

            {/* Existing Training Days */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Bestehende Trainingstage</h3>
              {trainingDays.length === 0 ? (
                <p className="text-gray-500 text-sm">Noch keine Trainingstage vorhanden.</p>
              ) : (
                <div className="space-y-2">
                  {trainingDays.map((day) => (
                    <div
                      key={day.id}
                      className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 p-3 border border-kaisho-greyLight rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm flex items-center gap-2 flex-wrap">
                          {day.name && <Badge tone="blue">{day.name}</Badge>}
                          {getWeekdayName(day.weekday)}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {formatTime(day.time_start)}
                          {day.time_end && ` – ${formatTime(day.time_end)}`}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Pencil className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setTrainingDayToEdit(day);
                            setShowEditModal(true);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<PauseCircle className="w-3.5 h-3.5" />}
                          onClick={() => handleDeactivateTrainingDay(day.id)}
                        />
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => handleDeleteTrainingDay(day.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Extra Trainings List */}
            {extraTrainings.length > 0 && (
              <section className="border-t border-kaisho-greyLight pt-4">
                <button
                  onClick={() => setIsExtraTrainingsOpen(!isExtraTrainingsOpen)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-kaisho-greyLight hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Extra-Trainings ({extraTrainings.length})
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExtraTrainingsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isExtraTrainingsOpen && (
                  <div className="space-y-2 mt-3">
                    {extraTrainings.map((extra) => (
                      <div
                        key={extra.id}
                        className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 p-3 border border-kaisho-greyLight rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {new Date(extra.override_date).toLocaleDateString('de-CH')}
                            {extra.time_start && ` · ${extra.time_start.slice(0, 5)}`}
                            {extra.time_end && ` – ${extra.time_end.slice(0, 5)}`}
                          </div>
                          {extra.reason && (
                            <div className="text-sm text-gray-500 mt-0.5">{extra.reason}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setExtraTrainingToEdit(extra);
                              setShowEditExtraModal(true);
                            }}
                          >
                            Bearbeiten
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => handleDeleteExtraTraining(extra.id)}
                          >
                            Löschen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Management Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 justify-between md:items-center">
              <h3 className="text-sm font-semibold text-gray-900">Benutzer ({mergedUsers.length})</h3>
              <Button
                onClick={() => setShowCreateTrainerModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Trainer anlegen
              </Button>
            </div>

            {/* Users List */}
            {loadingData ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-kaisho-blue border-t-transparent" />
                <p className="text-gray-500 mt-2 text-sm">Lade Benutzer…</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mergedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-lg border border-kaisho-greyLight flex flex-col md:flex-row md:items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        {user.isSuperAdmin && <Badge tone="purple">Super-Admin</Badge>}
                        {user.isAdmin && !user.isSuperAdmin && <Badge tone="blue">Admin</Badge>}
                        {user.isTrainer && <Badge tone="green">Trainer</Badge>}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5 truncate">
                        {user.email || user.username || 'Keine E-Mail'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!user.isAdmin && user.isTrainer && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => handlePromoteUser(user, false)}>
                            Zum Admin
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handlePromoteUser(user, true)}>
                            Zum Super-Admin
                          </Button>
                        </>
                      )}
                      {user.isAdmin && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRevokeAdmin(user)}
                          title="Admin-Rechte entfernen (Benutzer bleibt Trainer)"
                        >
                          Admin-Rechte entziehen
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => handleDeleteUser(user)}
                      >
                        Löschen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddTrainingDayModal && (
        <AddTrainingDayModal
          clubId={club.id}
          onClose={() => setShowAddTrainingDayModal(false)}
          onSuccess={onTrainingDayAdded}
        />
      )}

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
