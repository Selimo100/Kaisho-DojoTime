-- ========================================
-- SCHEDULED TRAINER CANCELLATIONS
-- Ermöglicht das Austragen von geplanten Trainern für bestimmte Tage
-- ========================================

-- Tabelle für Abwesenheiten von geplanten Trainern
CREATE TABLE IF NOT EXISTS public.trainer_schedule_exceptions (
  id BIGSERIAL PRIMARY KEY,
  trainer_schedule_id BIGINT NOT NULL REFERENCES public.trainer_schedules(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainer_schedule_id, exception_date)
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_trainer_schedule_exceptions_schedule_id 
  ON public.trainer_schedule_exceptions(trainer_schedule_id);
CREATE INDEX IF NOT EXISTS idx_trainer_schedule_exceptions_date 
  ON public.trainer_schedule_exceptions(exception_date);

-- Row Level Security
ALTER TABLE public.trainer_schedule_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_schedule_exceptions_select_policy" 
  ON public.trainer_schedule_exceptions
  FOR SELECT USING (true);

CREATE POLICY "trainer_schedule_exceptions_all_policy" 
  ON public.trainer_schedule_exceptions
  FOR ALL USING (true) WITH CHECK (true);

-- Funktion um Einträge mit Ausnahmen zu laden
CREATE OR REPLACE FUNCTION public.get_entries_with_scheduled_trainers(
  p_club_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  id BIGINT,
  club_id UUID,
  training_day_id BIGINT,
  trainer_id UUID,
  training_date DATE,
  trainer_name TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ,
  override_id BIGINT,
  is_scheduled BOOLEAN,
  schedule_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH actual_entries AS (
    SELECT 
      te.id,
      te.club_id,
      te.training_day_id,
      te.trainer_id,
      te.training_date,
      te.trainer_name,
      te.remark,
      te.created_at,
      te.override_id,
      false as is_scheduled,
      NULL::BIGINT as schedule_id
    FROM public.training_entries te
    WHERE te.club_id = p_club_id
      AND te.training_date >= p_start_date
      AND te.training_date <= p_end_date
  ),
  scheduled_entries AS (
    SELECT 
      -EXTRACT(EPOCH FROM ts.created_at)::BIGINT - td.id as id,
      p_club_id as club_id,
      ts.training_day_id,
      ts.trainer_id,
      dates.date as training_date,
      t.name as trainer_name,
      CASE 
        WHEN ts.notes IS NOT NULL THEN '📅 Geplant: ' || ts.notes
        ELSE '📅 Geplant'
      END as remark,
      ts.created_at,
      NULL::BIGINT as override_id,
      true as is_scheduled,
      ts.id as schedule_id
    FROM public.trainer_schedules ts
    JOIN public.trainers t ON ts.trainer_id = t.id
    JOIN public.training_days td ON ts.training_day_id = td.id
    CROSS JOIN LATERAL (
      SELECT generate_series(
        GREATEST(p_start_date, ts.start_date),
        CASE 
          WHEN ts.end_date IS NULL THEN p_end_date
          ELSE LEAST(p_end_date, ts.end_date)
        END,
        '1 day'::interval
      )::DATE as date
    ) dates
    WHERE t.club_id = p_club_id
      AND ts.is_active = true
      AND td.weekday = EXTRACT(DOW FROM dates.date)
      AND td.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.training_entries te2
        WHERE te2.training_date = dates.date
          AND te2.training_day_id = ts.training_day_id
          AND te2.trainer_id = ts.trainer_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.trainer_schedule_exceptions tse
        WHERE tse.trainer_schedule_id = ts.id
          AND tse.exception_date = dates.date
      )
  )
  SELECT * FROM actual_entries
  UNION ALL
  SELECT * FROM scheduled_entries
  ORDER BY training_date DESC, training_day_id;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_entries_with_scheduled_trainers TO anon, authenticated;
