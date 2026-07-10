-- ============================================================
-- Jahreskalender 2026 – Events für Kaisho Karate Bassersdorf
-- + Neue Kategorie-Spalte für Event-Typen
-- ============================================================

-- 1) Kategorie-Spalte für Overrides (Event-Typen zum Filtern / Farbcodieren)
--    Freitext, damit später weitere Kategorien möglich sind.
ALTER TABLE public.training_overrides
  ADD COLUMN IF NOT EXISTS category TEXT;

COMMENT ON COLUMN public.training_overrides.category IS
  'Optionale Kategorie eines Events, z.B. verbandstraining | turnier | kurs | camp | weihnachten | event';

-- 2) Events einfügen (Info-Events -> requires_trainers = false)
--    Der Verein wird über den Slug gefunden, keine UUID nötig.
--    Mehrtägiges Camp (06.-08.11.) wird als ein Event am Startdatum erfasst.
INSERT INTO public.training_overrides
  (club_id, override_date, time_start, time_end, action, requires_trainers, category, reason, created_by)
SELECT
  c.id, v.override_date, v.time_start, v.time_end,
  'extra', false, v.category, v.reason, 'Jahreskalender 2026'
FROM public.clubs c
CROSS JOIN (VALUES
  ('2026-01-24'::date, '10:00'::time, '12:00'::time, 'verbandstraining', 'Verbandstraining Kinder/Jugend · Volketswil · ab Orange-Gurt & ab 12 J.'),
  ('2026-03-14'::date, '10:00'::time, '12:00'::time, 'verbandstraining', 'Verbandstraining Kinder/Jugend · Volketswil · ab Orange-Gurt & ab 12 J.'),
  ('2026-03-14'::date, '13:30'::time, '15:00'::time, 'verbandstraining', 'Verbandstraining Erwachsene · Volketswil · ab 16 J.'),
  ('2026-04-11'::date, '10:00'::time, '12:00'::time, 'verbandstraining', 'Verbandstraining Kinder/Jugend · Volketswil · ab Orange-Gurt & ab 12 J.'),
  ('2026-05-09'::date, NULL::time,    NULL::time,    'turnier',          'Internationaler Karate Niki Cup · Höchst · ganzer Tag · ab Blau-Gurt'),
  ('2026-06-13'::date, '10:00'::time, '12:00'::time, 'verbandstraining', 'Verbandstraining Kinder/Jugend · Volketswil · ab Orange-Gurt & ab 12 J.'),
  ('2026-06-13'::date, '13:30'::time, '15:00'::time, 'verbandstraining', 'Verbandstraining Erwachsene · Volketswil · ab 16 J.'),
  ('2026-06-13'::date, '15:00'::time, NULL::time,    'kurs',             'Schiedsrichterkurs · Erwachsene · ab 15:00'),
  ('2026-06-14'::date, NULL::time,    NULL::time,    'turnier',          'Gedenkturnier Bruno Dammert · Volketswil · Vormittag · Kinder/Jugend bis 4. Kyu'),
  ('2026-07-04'::date, '10:00'::time, '12:00'::time, 'verbandstraining', 'Verbandstraining Kinder/Jugend · Volketswil · ab Orange-Gurt & ab 12 J.'),
  ('2026-07-05'::date, NULL::time,    NULL::time,    'turnier',          'Zürcher Kantonale Karatemeisterschaft · Bonstetten · ganzer Tag · Anmeldung via Sandra (Schluss 16.06.)'),
  ('2026-08-29'::date, '10:00'::time, '12:00'::time, 'verbandstraining', 'Verbandstraining Kinder/Jugend · Volketswil · ab Orange-Gurt & ab 12 J.'),
  ('2026-08-29'::date, '13:30'::time, '15:00'::time, 'verbandstraining', 'Verbandstraining Erwachsene · Volketswil · ab 16 J.'),
  ('2026-09-26'::date, '10:00'::time, '12:00'::time, 'verbandstraining', 'Verbandstraining Kinder/Jugend · Volketswil · ab Orange-Gurt & ab 12 J.'),
  ('2026-10-31'::date, '10:00'::time, '12:00'::time, 'verbandstraining', 'Verbandstraining Kinder/Jugend · Volketswil · ab Orange-Gurt & ab 12 J.'),
  ('2026-10-31'::date, '13:30'::time, '15:00'::time, 'verbandstraining', 'Verbandstraining Erwachsene · Volketswil · ab 16 J.'),
  ('2026-11-06'::date, NULL::time,    NULL::time,    'camp',             'Karate Trainingswochenende · 06.–08.11. · Kerenzerberg, Filzbach · ab 12 J. & Orange-Gurt'),
  ('2026-11-22'::date, NULL::time,    NULL::time,    'turnier',          'Freundschaftsturnier BCV · Volketswil · Kinder/Jugend bis 4. Kyu'),
  ('2026-12-05'::date, '10:00'::time, '12:00'::time, 'verbandstraining', 'Verbandstraining Kinder/Jugend · Volketswil · ab Orange-Gurt & ab 12 J.'),
  ('2026-12-05'::date, '13:30'::time, '15:00'::time, 'verbandstraining', 'Verbandstraining Erwachsene · Volketswil · ab 16 J.'),
  ('2026-12-15'::date, '17:45'::time, '19:15'::time, 'weihnachten',      'Kinder-Weihnachtstraining · Bassersdorf · alle · Infos folgen separat')
) AS v(override_date, time_start, time_end, category, reason)
WHERE c.slug = 'kaisho-karate-bassersdorf';
