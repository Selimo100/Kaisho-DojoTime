-- Ermöglicht das Benennen von wiederkehrenden Trainings (z.B. "Kids-Training", "Wettkampfgruppe")
-- Optionales Namensfeld für training_days
ALTER TABLE public.training_days
  ADD COLUMN IF NOT EXISTS name TEXT;
