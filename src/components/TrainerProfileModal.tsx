import { useRef, useState } from 'react';
import { format, parseISO, isPast, isToday, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import type { TrainingEntry, TrainingDay } from '../types';

interface TrainerProfileModalProps {
  trainingDays: TrainingDay[];
  overrides: any[];
  entries: TrainingEntry[];
  onClose: () => void;
}

export default function TrainerProfileModal({
  trainingDays,
  overrides,
  entries,
  onClose
}: TrainerProfileModalProps) {
  const { trainer } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [showPast, setShowPast] = useState(false);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');

  if (!trainer) return null;

  // 1. All entries for this trainer
  const allMyEntries = entries.filter(e => e.trainer_id === trainer.id);

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
        className={`p-4 rounded-xl border transition-all hover:bg-gray-50/50 ${
          isNext ? 'ring-2 ring-kaisho-blue ring-offset-2 border-kaisho-blue shadow-md' :
          entry.override_id 
            ? 'bg-purple-50/50 border-purple-100' 
            : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white font-bold shrink-0 shadow-sm ${
              entry.override_id ? 'bg-purple-500' : 'bg-kaisho-blue'
            }`}>
              <span className="text-xs opacity-80">
                {format(parseISO(entry.training_date), 'MMM', { locale: de }).toUpperCase()}
              </span>
              <span>
                {format(parseISO(entry.training_date), 'dd')}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {isNext && <span className="bg-kaisho-blue text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">NÄCHSTES</span>}
                <h4 className="font-bold text-gray-900">
                  {format(parseISO(entry.training_date), 'EEEE', { locale: de })}
                </h4>
                <span className="text-sm text-gray-500">
                  • {getEntryTime(entry)} Uhr
                </span>
                {entry.override_id && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                    EXTRA
                  </span>
                )}
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
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
        
        {/* Header */}
        <div className="flex-none p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-kaisho-blue">Meine Trainings</h2>
              <p className="text-gray-500 text-sm mt-1">
                Hallo {trainer.name.split(' ')[0]}! Hier ist dein Trainingsplan.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-kaisho-blue/20 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                disabled={upcomingEntries.length === 0}
              >
                <option value="all">Alle kommenden Monate</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: de })}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Filter Info Badge */}
            {selectedMonthFilter !== 'all' && (
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-medium">
                 {filteredUpcoming.length} Trainings
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30" ref={printRef}>
          {upcomingEntries.length === 0 && pastEntries.length === 0 ? (
            <div className="text-center py-12">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Keine Trainings</h3>
              <p className="text-gray-500 mt-2">Du bist aktuell für keine Trainings eingetragen.</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Upcoming Trainings */}
              {filteredUpcoming.length > 0 ? (
                Object.keys(groupedUpcoming).sort().map((monthKey) => (
                  <div key={monthKey} className="space-y-3">
                     <div className="flex items-center gap-3">
                       <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                          {format(parseISO(monthKey + '-01'), 'MMMM yyyy', { locale: de })}
                       </h3>
                       <div className="h-px bg-gray-200 flex-1"></div>
                     </div>
                     <div className="space-y-3">
                        {groupedUpcoming[monthKey].map((entry) => {
                          // Check if this is the very first upcoming entry overall (Next Training)
                          const isOverallNext = upcomingEntries.length > 0 && entry.id === upcomingEntries[0].id;
                          return renderEntryCard(entry, isOverallNext);
                        })}
                     </div>
                  </div>
                ))
              ) : (
                upcomingEntries.length > 0 && (
                   <div className="text-center py-8 text-gray-500 italic">
                      Keine Trainings im gewählten Monat.
                   </div>
                )
              )}

              {/* Past Trainings Section (Collapsible) */}
              {pastEntries.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <button 
                    onClick={() => setShowPast(!showPast)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors w-full group"
                  >
                    <div className={`p-1 rounded-md bg-gray-100 group-hover:bg-gray-200 transition-colors`}>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${showPast ? 'rotate-180' : ''}`} 
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    <span>Vergangene Trainings ({pastEntries.length})</span>
                  </button>
                  
                  {showPast && (
                    <div className="mt-4 space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                         {pastEntries.map(entry => renderEntryCard(entry))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-colors"
          >
            Schliessen
          </button>
          
          {(filteredUpcoming.length > 0 || (showPast && pastEntries.length > 0)) && (
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-kaisho-blue text-white font-medium hover:bg-kaisho-blueLight rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              PDF / Drucken
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
