import { supabase } from './supabaseClient';
import type {
  Club,
  TrainingDay,
  TrainingEntry,
  CreateTrainingEntryInput,
  CreateTrainingDayInput,
  Admin,
  AdminLoginInput,
  CreateAdminInput,
  Trainer,
} from '../types';

// ========== CLUBS ==========

export async function getClubs(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching clubs:', error);
    throw error;
  }

  return data || [];
}

export async function getClubBySlug(slug: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching club by slug:', error);
    return null;
  }

  return data;
}

// ========== TRAINING DAYS ==========

export async function getTrainingDaysByClub(clubId: string): Promise<TrainingDay[]> {
  const { data, error } = await supabase
    .from('training_days')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_active', true)
    .order('weekday')
    .order('time_start');

  if (error) {
    console.error('Error fetching training days:', error);
    throw error;
  }

  return data || [];
}

export async function createTrainingDay(
  input: CreateTrainingDayInput
): Promise<TrainingDay> {
  const { data, error } = await supabase
    .from('training_days')
    .insert({
      club_id: input.club_id,
      weekday: input.weekday,
      time_start: input.time_start,
      time_end: input.time_end || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating training day:', error);
    throw error;
  }

  return data;
}

export async function deleteTrainingDay(id: number): Promise<void> {
  const { error } = await supabase
    .from('training_days')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting training day:', error);
    throw error;
  }
}

export async function deactivateTrainingDay(id: number): Promise<void> {
  const { error } = await supabase
    .from('training_days')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deactivating training day:', error);
    throw error;
  }
}

export async function updateTrainingDay(
  id: number,
  updates: {
    weekday?: number;
    time_start?: string;
    time_end?: string;
  }
): Promise<TrainingDay> {
  const { data, error } = await supabase
    .from('training_days')
    .update({
      weekday: updates.weekday,
      time_start: updates.time_start,
      time_end: updates.time_end || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating training day:', error);
    throw error;
  }

  return data;
}

export async function updateOverride(
  id: number,
  updates: {
    override_date?: string;
    time_start?: string;
    time_end?: string | null;
    reason?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from('training_overrides')
    .update({
      override_date: updates.override_date,
      time_start: updates.time_start,
      time_end: updates.time_end,
      reason: updates.reason,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating override:', error);
    throw error;
  }
}

// ========== TRAINING ENTRIES ==========

export async function getEntriesByClubAndDay(
  clubId: string,
  trainingDayId?: number,
  trainingDate?: string
): Promise<TrainingEntry[]> {
  let query = supabase
    .from('training_entries')
    .select('*')
    .eq('club_id', clubId);

  if (trainingDayId) {
    query = query.eq('training_day_id', trainingDayId);
  }

  if (trainingDate) {
    query = query.eq('training_date', trainingDate);
  }

  query = query.order('training_date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching training entries:', error);
    throw error;
  }

  return data || [];
}

export async function createTrainingEntry(
  input: CreateTrainingEntryInput & { trainer_id: string }
): Promise<TrainingEntry> {
  const { data, error } = await supabase
    .from('training_entries')
    .insert({
      club_id: input.club_id,
      training_day_id: input.training_day_id,
      override_id: input.override_id || null,
      training_date: input.training_date,
      trainer_id: input.trainer_id,
      trainer_name: input.trainer_name,
      remark: input.remark || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating training entry:', error);
    throw error;
  }

  return data;
}

export async function deleteTrainingEntry(entryId: number): Promise<void> {
  const { error } = await supabase
    .from('training_entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('Error deleting training entry:', error);
    throw error;
  }
}

// ========== TRAINERS (Authentication) ==========

export async function getAllTrainers(): Promise<Trainer[]> {
  const { data, error } = await supabase
    .from('trainers')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching trainers:', error);
    throw error;
  }

  return data || [];
}

export async function deleteTrainer(trainerId: string): Promise<void> {
  const { error } = await supabase
    .from('trainers')
    .delete()
    .eq('id', trainerId);

  if (error) {
    console.error('Error deleting trainer:', error);
    throw error;
  }
}

export async function registerTrainer(input: {
  email: string;
  name: string;
  password: string;
  club_id: string;
}): Promise<any> {
  // Einfaches Passwort-Hashing mit SQL crypt (in Production besser machen!)
  const { data, error } = await supabase.rpc('create_trainer', {
    p_email: input.email,
    p_name: input.name,
    p_password: input.password,
    p_club_id: input.club_id,
  });

  if (error) {
    console.error('Error registering trainer:', error);
    throw error;
  }

  return data;
}

export async function loginTrainer(email: string, password: string): Promise<any> {
  const { data, error } = await supabase.rpc('verify_trainer', {
    p_email: email,
    p_password: password,
  });

  if (error) {
    console.error('Error logging in:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Ungültige Anmeldedaten');
  }

  return data[0];
}

export async function getTrainersByClub(clubId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('trainers')
    .select('id, email, name, created_at')
    .eq('club_id', clubId)
    .order('name');

  if (error) {
    console.error('Error fetching trainers:', error);
    throw error;
  }

  return data || [];
}

// ========== TRAINING OVERRIDES ==========

export async function getOverridesByClub(
  clubId: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  let query = supabase
    .from('training_overrides')
    .select('*')
    .eq('club_id', clubId);

  if (startDate) {
    query = query.gte('override_date', startDate);
  }

  if (endDate) {
    query = query.lte('override_date', endDate);
  }

  query = query.order('override_date');

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching overrides:', error);
    throw error;
  }

  return data || [];
}

export async function createOverride(input: {
  club_id: string;
  training_day_id?: number;
  override_date: string;
  action: 'cancel' | 'extra';
  time_start?: string;
  time_end?: string;
  reason?: string;
  created_by?: string;
}): Promise<any> {
  const { data, error } = await supabase
    .from('training_overrides')
    .insert({
      club_id: input.club_id,
      training_day_id: input.training_day_id || null,
      override_date: input.override_date,
      action: input.action,
      time_start: input.time_start || null,
      time_end: input.time_end || null,
      reason: input.reason || null,
      created_by: input.created_by || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating override:', error);
    throw error;
  }

  return data;
}

export async function deleteOverride(id: number): Promise<void> {
  const { error } = await supabase
    .from('training_overrides')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting override:', error);
    throw error;
  }
}

// ==================== Admin Functions ====================

export async function loginAdmin(input: AdminLoginInput): Promise<Admin | null> {
  const { data, error } = await supabase.rpc('verify_admin', {
    p_username: input.username,
    p_password: input.password,
  });

  if (error) {
    console.error('Admin login error:', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  return data[0];
}

export async function getAllAdmins(): Promise<Admin[]> {
  const { data, error } = await supabase
    .from('admins')
    .select('id, username, email, full_name, is_super_admin, club_id, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAdmin(input: CreateAdminInput): Promise<number> {
  const { data, error } = await supabase.rpc('create_admin', {
    p_username: input.username,
    p_password: input.password,
    p_email: input.email || null,
    p_full_name: input.full_name || null,
    p_is_super_admin: input.is_super_admin || false,
    p_club_id: input.club_id || null,
  });

  if (error) throw error;
  return data;
}

export async function deleteAdmin(id: number): Promise<void> {
  const { error } = await supabase
    .from('admins')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function promoteTrainerToAdmin(input: {
  trainer: Trainer;
  isSuperAdmin: boolean;
}): Promise<number> {
  // Verwende RPC-Funktion um Passwort-Hash zu kopieren
  const { data, error } = await supabase.rpc('promote_trainer_to_admin', {
    p_trainer_id: input.trainer.id,
    p_is_super_admin: input.isSuperAdmin,
  });

  if (error) {
    console.error('Error promoting trainer to admin:', error);
    throw error;
  }

  return data as number;
}
