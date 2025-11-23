# Kaisho DojoTime

Webanwendung für die **Kaisho Karate Association** zur Verwaltung von Trainer-Verfügbarkeiten für Trainings.

## 🥋 Features

- **Vereinsübersicht**: Startseite mit allen 5 Karate-Vereinen
- **Trainerverwaltung**: Trainer können sich einfach für Trainingstage eintragen
- **Trainingstage**: Konfigurierbare Wochentage mit Uhrzeiten
- **Admin-Panel**: Verwaltung von Trainingstagen (Hinzufügen, Löschen, Deaktivieren)
- **Responsive Design**: Optimiert für Desktop und Mobile

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend/DB**: Supabase (PostgreSQL)
- **Routing**: React Router v6
- **Hosting**: Netlify (Frontend) + Supabase (Backend)

## 📋 Voraussetzungen

- Node.js (v18 oder höher)
- npm oder yarn
- Supabase-Account (kostenlos bei [supabase.com](https://supabase.com))

## 🚀 Installation & Setup

### 1. Repository klonen

```bash
git clone <repository-url>
cd Kaisho-DojoTime
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Supabase-Projekt erstellen

1. Erstellen Sie ein neues Projekt auf [supabase.com](https://supabase.com)
2. Führen Sie das SQL-Schema aus (siehe `supabase-schema.sql`)
3. Kopieren Sie die Project URL und Anon Key

### 4. Environment-Variablen konfigurieren

Erstellen Sie eine `.env` Datei im Root-Verzeichnis:

```bash
cp .env.example .env
```

Fügen Sie Ihre Supabase-Credentials ein:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist nun unter `http://localhost:5173` erreichbar.

## 🗄️ Datenbank-Setup

Das komplette Datenbank-Schema finden Sie in der Datei `supabase-schema.sql`.

### Tabellen-Übersicht:

- **clubs**: Vereine mit Name, Stadt, Slug und Admin-Passwort
- **training_days**: Trainingstage (Wochentag, Uhrzeit) pro Verein
- **training_entries**: Trainer-Einträge für konkrete Trainings

Führen Sie das SQL-Schema im Supabase SQL Editor aus, um die Tabellen und Beispieldaten zu erstellen.

## 🏗 Projektstruktur

```
src/
├── components/          # React-Komponenten
│   ├── AdminPanel.tsx   # Admin-Verwaltung
│   ├── ClubCard.tsx     # Vereins-Kachel
│   └── TrainingDayCard.tsx  # Trainingstag mit Einträgen
├── lib/                 # Bibliotheken & Services
│   ├── supabaseClient.ts    # Supabase-Initialisierung
│   └── supabaseService.ts   # CRUD-Operationen
├── pages/               # Seiten-Komponenten
│   ├── HomePage.tsx     # Startseite
│   └── ClubPage.tsx     # Vereinsseite
├── types/               # TypeScript-Typen
│   └── index.ts
├── utils/               # Hilfsfunktionen
│   └── formatters.ts
├── App.tsx              # Haupt-App-Komponente
├── main.tsx             # Entry Point
└── index.css            # Globale Styles
```

## 📱 Verwendung

### Als Trainer:

1. Wählen Sie Ihren Verein auf der Startseite
2. Wählen Sie einen Trainingstag aus
3. Klicken Sie auf "Trainer eintragen"
4. Geben Sie Datum, Name und optional eine Bemerkung ein
5. Klicken Sie auf "Speichern"

### Als Admin:

1. Navigieren Sie zur Vereinsseite
2. Klicken Sie auf "Admin Login"
3. Geben Sie das Admin-Passwort ein
4. Verwalten Sie Trainingstage:
   - Neue Trainingstage hinzufügen
   - Bestehende Trainingstage deaktivieren oder löschen

## 🔑 Standard Admin-Passwörter

Die Admin-Passwörter sind in der `supabase-schema.sql` definiert:

- Alle Vereine: `admin123` (⚠️ In Produktion bitte ändern!)

## 🚢 Deployment

### Frontend (Netlify):

1. Verbinden Sie Ihr GitHub-Repository mit Netlify
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Fügen Sie die Environment-Variablen hinzu

### Backend (Supabase):

Supabase läuft bereits als externe Service. Keine zusätzlichen Deployment-Schritte notwendig.

## 📄 Lizenz

MIT License - Siehe LICENSE-Datei für Details.

## 🤝 Kontakt

Bei Fragen oder Problemen öffnen Sie bitte ein Issue im Repository.

---

Entwickelt mit ❤️ für die Kaisho Karate Association
