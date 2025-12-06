export interface Club {
  id: string;
  name: string;
  city: string;
  slug: string;
  admin_password: string;
  address?: string;
  website_url?: string;
}

export interface TrainingDay {
  id: number;
  club_id: string;
  weekday: number; // 0 = Sonntag, 1 = Montag, ... 6 = Samstag
  time_start: string; // HH:MM format
  time_end: string | null; // HH:MM format
  is_active: boolean;
}

export interface TrainingEntry {
  id: number;
  club_id: string;
  training_day_id: number | null;
  override_id?: number | null; // Für Extra-Trainings
  trainer_id: string;
  training_date: string; // YYYY-MM-DD format
  trainer_name: string;
  remark: string | null;
  created_at: string;
}

export interface CreateTrainingEntryInput {
  club_id: string;
  training_day_id: number | null;
  override_id?: number;
  training_date: string;
  trainer_name: string;
  remark?: string;
}

export interface CreateTrainingDayInput {
  club_id: string;
  weekday: number;
  time_start: string;
  time_end?: string;
}

export interface Trainer {
  id: string;
  email: string;
  name: string;
  club_id: string;
  created_at: string;
}

export interface TrainerLoginInput {
  email: string;
  password: string;
}

export interface TrainerRegisterInput {
  email: string;
  name: string;
  password: string;
  club_id: string;
}

export interface TrainingOverride {
  id: number;
  club_id: string;
  training_day_id?: number | null;
  override_date: string; // YYYY-MM-DD format
  time_start: string | null;
  time_end: string | null;
  action: 'cancel' | 'extra';
  reason: string | null;
  requires_trainers?: boolean; // Für Events: false = reine Info-Anzeige
  created_at: string;
  created_by: string | null;
}

export interface CreateOverrideInput {
  club_id: string;
  training_day_id?: number;
  override_date: string;
  action: 'cancel' | 'extra';
  time_start?: string;
  time_end?: string;
  reason?: string;
  created_by?: string;
}

export interface TrainingSlot {
  date: string; // YYYY-MM-DD
  weekday: number;
  timeStart: string;
  timeEnd: string | null;
  trainingDayId: number;
  overrideId?: number; // Für Extra-Trainings
  isCancelled: boolean;
  isExtra: boolean;
  isEvent: boolean; // Für reine Info-Events ohne Trainer
  reason?: string;
}

export interface Admin {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  is_super_admin: boolean;
  club_id?: string;
  created_at: string;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface CreateAdminInput {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
  is_super_admin?: boolean;
  club_id?: string;
}

export interface TrainerSchedule {
  id: number;
  trainer_id: string;
  training_day_id: number;
  start_date: string; // YYYY-MM-DD format
  end_date: string | null; // YYYY-MM-DD format, NULL = unbegrenzt
  is_active: boolean;
  created_at: string;
  created_by_admin_id?: number;
  notes?: string;
}

export interface CreateTrainerScheduleInput {
  training_day_id: number;
  start_date: string;
  end_date?: string | null;
  notes?: string;
}

export interface CreateTrainerWithScheduleInput {
  email: string;
  name: string;
  password: string;
  club_id: string;
  schedules: CreateTrainerScheduleInput[];
}
