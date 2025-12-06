-- ========================================
-- CLUB INFORMATION ENHANCEMENT
-- Fügt Adresse und Website-Link zu Clubs hinzu
-- ========================================

-- Füge neue Spalten zur clubs Tabelle hinzu
ALTER TABLE public.clubs 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Aktualisiere bestehende Clubs mit den bereitgestellten Informationen
UPDATE public.clubs 
SET 
  address = 'Turnhalle Chrüzacher, Bodenring 46, 8303 Bassersdorf',
  website_url = 'https://kaisho-bassersdorf.ch/'
WHERE slug = 'kaisho-karate-bassersdorf';

UPDATE public.clubs 
SET 
  address = 'Turnhalle Sagi, im Trottenrain, 8542 Wiesendangen',
  website_url = 'https://www.karatekai.ch/web/?page_id=30'
WHERE slug = 'karate-kai-wiesendangen';

UPDATE public.clubs 
SET 
  address = 'Neuwiesen-Turnhalle, 8400 Winterthur',
  website_url = 'https://www.karatekai.ch/web/'
WHERE slug = 'karate-kai-winterthur';

UPDATE public.clubs 
SET 
  address = 'Industriestrasse 23, Eisenwerk Turnhalle, 8500 Frauenfeld',
  website_url = 'https://www.karatekai.ch/web/?page_id=28'
WHERE slug = 'karate-kai-frauenfeld';

-- Kaisho Zürich Höngg (falls keine Adresse vorhanden)
UPDATE public.clubs 
SET 
  address = 'Turnhalle, Zürich Höngg',
  website_url = 'https://kaisho-budo.ch/'
WHERE slug = 'kaisho-budo-akademie-zuerich-hoengg' AND (address IS NULL OR address = '');
