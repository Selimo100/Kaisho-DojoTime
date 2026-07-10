import { useRef, useState, useEffect } from 'react';
import { format, parseISO, isPast, isToday, startOfMonth, subYears, addYears } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2, Printer, ChevronDown, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getEntriesWithScheduledTrainers } from '../lib/supabaseService';
import type { TrainingEntry, TrainingDay } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';

interface TrainerProfileModalProps {
  clubId: string;
  trainingDays: TrainingDay[];
  overrides: any[];
  entries: TrainingEntry[];
  onClose: () => void;
}

export default function TrainerProfileModal({
  clubId,
  trainingDays,
  overrides,
  entries: initialEntries,
  onClose
}: TrainerProfileModalProps) {
  const { trainer } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [showPast, setShowPast] = useState(false);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  
  const [isLoading, setIsLoading] = useState(false);
  const [allEntries, setAllEntries] = useState<TrainingEntry[]>(initialEntries);

  useEffect(() => {
    if (!clubId || !trainer) return;

    const loadFullHistory = async () => {
      setIsLoading(true);
      try {
        // Load extensive history (2 years back, 2 years forward)
        // to ensure export and list are complete
        const now = new Date();
        const startDate = format(subYears(now, 2), 'yyyy-01-01');
        const endDate = format(addYears(now, 2), 'yyyy-12-31');

        const fullEntries = await getEntriesWithScheduledTrainers(clubId, startDate, endDate);
        setAllEntries(fullEntries);
      } catch (error) {
        console.error('Error loading full trainer history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFullHistory();
  }, [clubId, trainer]);

  if (!trainer) return null;

  // 1. All entries for this trainer
  const allMyEntries = allEntries.filter(e => e.trainer_id === trainer.id);

  // 2. Helper to find time
  const getEntryTime = (entry: TrainingEntry) => {
    if (entry.override_id) {
      const override = overrides.find(o => o.id === entry.override_id);
      if (override && override.time_start) return override.time_start.slice(0, 5);
    }
    if (entry.training_day_id) {
      const day = trainingDays.find(d => d.id === entry.training_day_id);
      if (day && day.time_start) return day.time_start.slice(0, 5);
    }
    return '??:??';
  };

  const getEntryType = (entry: TrainingEntry) => {
    if (entry.override_id) return 'Extra-Training';
    return 'Reguläres Training';
  };

  // 3. Separate Future/Today vs Past
  // Sort Upcoming: ASC (soonest first)
  // Sort Past: DESC (most recent first)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEntries = allMyEntries
    .filter(e => {
      const d = parseISO(e.training_date);
      // isPast returns true if date < now. We want Today included in "Upcoming".
      // Date-fns isPast uses strictly < Date.now().
      // Let's use string comparison for YYYY-MM-DD or simple time compare.
      // But simpler: if !isPast(d) OR isToday(d)
      return !isPast(d) || isToday(d);
    })
    .sort((a, b) => new Date(a.training_date).getTime() - new Date(b.training_date).getTime());

  const pastEntries = allMyEntries
    .filter(e => {
      const d = parseISO(e.training_date);
      return isPast(d) && !isToday(d);
    })
    .sort((a, b) => new Date(b.training_date).getTime() - new Date(a.training_date).getTime());

  // 4. Generate Month Options for Filter (only from upcoming usually?)
  // User asked "filter per month" - probably mainly for upcoming plan.
  const availableMonths = Array.from(new Set(upcomingEntries.map(e => {
      const d = parseISO(e.training_date);
      return format(startOfMonth(d), 'yyyy-MM');
  }))).sort();

  // 5. Apply Filter to Upcoming
  const filteredUpcoming = upcomingEntries.filter(e => {
    if (selectedMonthFilter === 'all') return true;
    const monthStr = format(startOfMonth(parseISO(e.training_date)), 'yyyy-MM');
    return monthStr === selectedMonthFilter;
  });

  // Grouping logic for "Make it nice"
  const groupEntriesByMonth = (entriesList: TrainingEntry[]) => {
    const grouped: Record<string, TrainingEntry[]> = {};
    entriesList.forEach(e => {
      const key = format(startOfMonth(parseISO(e.training_date)), 'yyyy-MM');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });
    return grouped;
  };

  const groupedUpcoming = groupEntriesByMonth(filteredUpcoming);

  const handlePrint = () => {
    if (!printRef.current) return;
    
    // We construct print view manually to include Headers and Past cleanly
    const title = `Trainingsliste - ${trainer.name}`;
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
              h1 { color: #1e3a8a; margin-bottom: 20px; font-size: 24px; }
              .header-info { margin-bottom: 30px; color: #4b5563; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
              th { color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; }
              tr:nth-child(even) { bg-color: #f9fafb; }
              .status-extra { color: #9333ea; font-weight: 500; }
              h3 { margin-top: 30px; margin-bottom: 15px; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
              .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; text-align: center; }
            </style>
          </head>
          <body>
            <h1>Meine Trainings - ${trainer.name}</h1>
            <div class="header-info">
              <p>Email: ${trainer.email}</p>
              <p>Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
            </div>
            
            <h3>Aktuelle / Zukünftige Trainings</h3>
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Zeit</th>
                  <th>Typ</th>
                  <th>Bemerkung</th>
                </tr>
              </thead>
              <tbody>
                ${filteredUpcoming.map(entry => `
                  <tr>
                    <td>${format(parseISO(entry.training_date), 'EEEE, dd.MM.yyyy', { locale: de })}</td>
                    <td>${getEntryTime(entry)}</td>
                    <td class="${entry.override_id ? 'status-extra' : ''}">${getEntryType(entry)}</td>
                    <td>${entry.remark || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${showPast && pastEntries.length > 0 ? `
              <h3>Vergangene Trainings</h3>
              <table>
                 <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Zeit</th>
                    <th>Typ</th>
                    <th>Bemerkung</th>
                  </tr>
                </thead>
                <tbody>
                  ${pastEntries.map(entry => `
                    <tr>
                      <td>${format(parseISO(entry.training_date), 'EEEE, dd.MM.yyyy', { locale: de })}</td>
                      <td>${getEntryTime(entry)}</td>
                      <td class="${entry.override_id ? 'status-extra' : ''}">${getEntryType(entry)}</td>
                      <td>${entry.remark || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}

            <div class="footer">
              Generiert von DojoTime
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const renderEntryCard = (entry: TrainingEntry, isNext: boolean = false) => {
    return (
      <div
        key={entry.id}
        className={`p-4 rounded-lg border transition-colors ${
          isNext ? 'border-kaisho-blue bg-kaisho-blueIce' : 'border-kaisho-greyLight bg-white'
        }`}
      >
        <div className="flex gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white font-semibold shrink-0 ${
              entry.override_id ? 'bg-purple-500' : 'bg-kaisho-blue'
            }`}
          >
            <span className="text-[10px] opacity-80">
              {format(parseISO(entry.training_date), 'MMM', { locale: de }).toUpperCase()}
            </span>
            <span>{format(parseISO(entry.training_date), 'dd')}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isNext && <Badge tone="blue">Nächstes</Badge>}
              <h4 className="font-medium text-gray-900">
                {format(parseISO(entry.training_date), 'EEEE', { locale: de })}
              </h4>
              <span className="text-sm text-gray-500">· {getEntryTime(entry)} Uhr</span>
              {entry.override_id && <Badge tone="purple">Extra</Badge>}
            </div>
            <p className="text-sm text-gray-600">
              {entry.remark ? (
                <span className="italic">"{entry.remark}"</span>
              ) : (
                <span className="text-gray-400">Keine Bemerkung</span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const canPrint = filteredUpcoming.length > 0 || (showPast && pastEntries.length > 0);

  return (
    <Modal
      title="Meine Trainings"
      subtitle={`Hallo ${trainer.name.split(' ')[0]}! Hier ist dein Trainingsplan.`}
      icon={<CalendarDays className="w-5 h-5" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Schliessen
          </Button>
          {canPrint && (
            <Button onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
              PDF / Drucken
            </Button>
          )}
        </>
      }
    >
      <div ref={printRef}>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-kaisho-greyLight rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-kaisho-blueLight/40 cursor-pointer disabled:opacity-50"
            disabled={upcomingEntries.length === 0}
          >
            <option value="all">Alle kommenden Monate</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: de })}
              </option>
            ))}
          </select>
          {selectedMonthFilter !== 'all' && (
            <Badge tone="blue">{filteredUpcoming.length} Trainings</Badge>
          )}
          {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        </div>

        {upcomingEntries.length === 0 && pastEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <CalendarDays className="w-7 h-7" />
            </div>
            <h3 className="text-base font-medium text-gray-900">Keine Trainings</h3>
            <p className="text-gray-500 mt-1 text-sm">Du bist aktuell für keine Trainings eingetragen.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Trainings */}
            {filteredUpcoming.length > 0 ? (
              Object.keys(groupedUpcoming)
                .sort()
                .map((monthKey) => (
                  <div key={monthKey} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {format(parseISO(monthKey + '-01'), 'MMMM yyyy', { locale: de })}
                      </h3>
                      <div className="h-px bg-kaisho-greyLight flex-1" />
                    </div>
                    <div className="space-y-2">
                      {groupedUpcoming[monthKey].map((entry) => {
                        const isOverallNext =
                          upcomingEntries.length > 0 && entry.id === upcomingEntries[0].id;
                        return renderEntryCard(entry, isOverallNext);
                      })}
                    </div>
                  </div>
                ))
            ) : (
              upcomingEntries.length > 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Keine Trainings im gewählten Monat.
                </div>
              )
            )}

            {/* Past Trainings Section (Collapsible) */}
            {pastEntries.length > 0 && (
              <div className="pt-6 border-t border-kaisho-greyLight">
                <button
                  onClick={() => setShowPast(!showPast)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showPast ? 'rotate-180' : ''}`}
                  />
                  <span>Vergangene Trainings ({pastEntries.length})</span>
                </button>

                {showPast && (
                  <div className="mt-4 space-y-2">
                    {pastEntries.map((entry) => renderEntryCard(entry))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
