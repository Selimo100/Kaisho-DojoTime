# 🥋 Kaisho DojoTime - Setup Anleitung

## ✅ Schritt 1: Datenbank komplett neu aufsetzen

1. **Öffnen Sie Ihr Supabase Dashboard:**

   - URL: https://supabase.com/dashboard/project/fpnhduakuwuiegerdgku

2. **Navigieren Sie zum SQL Editor:**

   - Im linken Menü: **SQL Editor** auswählen
   - Klicken Sie auf **"New query"**

3. **Kopieren Sie das komplette Setup-Script:**

   - Öffnen Sie die Datei: **`database-setup.sql`**
   - Kopieren Sie den **GESAMTEN** Inhalt (alles!)

4. **Führen Sie das Script aus:**

   - Fügen Sie das SQL-Script in den SQL Editor ein
   - Klicken Sie auf **"Run"** (oder Cmd+Enter / Ctrl+Enter)
   - ⚠️ Das Script löscht ALLE alten Tabellen und erstellt sie neu!

5. **Verifizieren Sie die Tabellen:**
   - Gehen Sie zu **Table Editor** im linken Menü
   - Sie sollten sehen:
     - ✅ `clubs` (5 Vereine mit Beispieldaten)
     - ✅ `training_days` (Beispiel-Trainingstage für 2 Vereine)
     - ✅ `trainers` (leer - wird durch Registrierung gefüllt)
     - ✅ `training_entries` (leer - wird durch Einträge gefüllt)

## 🚀 Schritt 2: Anwendung starten

```bash
npm run dev
```

Die App läuft jetzt auf: **http://localhost:5173**

## 📝 So funktioniert die App:

### Für Trainer:

1. **Verein auswählen** auf der Startseite
2. **Registrieren / Anmelden:**

   - Klicken Sie auf "Anmelden & Eintragen" bei einem Trainingstag
   - Registrieren Sie sich mit E-Mail, Name und Passwort
   - Ihre Anmeldedaten werden sicher gespeichert

3. **Für Training eintragen:**

   - Nach dem Login können Sie sich direkt eintragen
   - Wählen Sie ein Datum
   - Ihr Name wird automatisch verwendet
   - Optional: Bemerkung hinzufügen

4. **Einträge ansehen:**
   - Alle Einträge sind für alle sichtbar
   - Nur Ihr eigener Name wird angezeigt

### Für Admins:

1. **Admin Login** (Passwort: `admin123`)
2. **Trainingstage verwalten:**
   - Neue Trainingstage hinzufügen (Wochentag, Uhrzeit)
   - Trainingstage deaktivieren oder löschen

## 🔐 Sicherheitsfeatures:

- ✅ **Trainer-Authentifizierung**: Passwort-geschützte Registrierung
- ✅ **Passwort-Hashing**: Passwörter werden in der DB gehasht
- ✅ **Vereins-Zuordnung**: Trainer gehören zu einem Verein
- ✅ **Row Level Security**: Datenbank ist geschützt
- ✅ **Admin-Bereich**: Passwort-geschützt

## 📊 Datenbank-Schema:

```sql
clubs
├── id (UUID)
├── name (TEXT)
├── city (TEXT)
├── slug (TEXT, unique)
└── admin_password (TEXT)

trainers
├── id (UUID)
├── email (TEXT, unique)
├── name (TEXT)
├── password_hash (TEXT)
└── club_id (UUID) → clubs.id

training_days
├── id (BIGSERIAL)
├── club_id (UUID) → clubs.id
├── weekday (INTEGER, 0-6)
├── time_start (TIME)
├── time_end (TIME)
└── is_active (BOOLEAN)

training_entries
├── id (BIGSERIAL)
├── club_id (UUID) → clubs.id
├── training_day_id (BIGINT) → training_days.id
├── trainer_id (UUID) → trainers.id
├── training_date (DATE)
├── trainer_name (TEXT)
└── remark (TEXT)
```

## 🛠 Technologie-Stack:

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Custom mit pgcrypto
- **State**: React Context API

## 📱 Features:

- ✅ Responsive Design (Mobile & Desktop)
- ✅ Trainer-Registrierung & Login
- ✅ Automatische Namenszuordnung
- ✅ Admin-Panel für Trainingstage
- ✅ Echtzeit-Datenbank
- ✅ Passwort-geschützt
- ✅ Mehrere Vereine

## 🔑 Standard-Passwörter:

- **Admin**: `admin123` (für alle Vereine)
- **Trainer**: Selbst wählbar bei Registrierung

⚠️ **Wichtig**: Ändern Sie die Admin-Passwörter in der Produktion!

## 🚢 Deployment (Optional):

### Frontend → Netlify:

```bash
npm run build
# Upload dist/ folder to Netlify
```

### Environment Variables:

```
VITE_SUPABASE_URL=https://fpnhduakuwuiegerdgku.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

**Viel Erfolg mit Ihrer Kaisho DojoTime App! 🥋**
