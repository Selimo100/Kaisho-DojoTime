import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { X, RefreshCw, Database, Activity, Users, FileJson, UserX, UserCheck } from 'lucide-react';

export default function DeveloperPanel() {
  const { trainer } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'stats' | 'users' | 'raw'>('activity');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Only allow access for specific email
  const isDev = trainer?.email?.toLowerCase() === 'selina@mogicato.ch';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open on 'd' only if user is dev and not typing in an input
      if (
        e.key === 'd' && 
        isDev && 
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDev]);

  useEffect(() => {
    if (isOpen && isDev) {
      fetchData();
    }
  }, [isOpen, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setData(null); // Reset data to prevent rendering with wrong schema
    setError(null);
    
    try {
      if (activeTab === 'activity') {
        const { data: entries, error } = await supabase
          .from('training_entries')
          .select(`
            *,
            clubs (name)
          `)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        setData(entries);
      } else if (activeTab === 'stats') {
        // Fetch detailed stats
        const { data: allClubs } = await supabase.from('clubs').select('*').order('name');
        const { data: allTrainers } = await supabase.from('trainers').select('id, club_id');
        
        // Try to fetch deleted trainers count
        let deletedTrainersCount = 0;
        try {
          const { count } = await supabase.from('deleted_trainers').select('*', { count: 'exact', head: true });
          deletedTrainersCount = count || 0;
        } catch (e) {
          console.warn('Could not fetch deleted trainers count');
        }
        
        const { count: totalEntries } = await supabase.from('training_entries').select('*', { count: 'exact', head: true });
        
        // Entries last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: recentEntries } = await supabase
          .from('training_entries')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString());

        // Process data
        const clubStats = allClubs?.map(club => {
            const trainerCount = allTrainers?.filter(t => t.club_id === club.id).length || 0;
            return {
                ...club,
                trainerCount
            };
        });

        setData({
          clubs: clubStats || [],
          totalClubs: allClubs?.length || 0,
          totalTrainers: allTrainers?.length || 0,
          deletedTrainers: deletedTrainersCount,
          totalEntries: totalEntries || 0,
          recentEntries: recentEntries || 0
        });
      } else if (activeTab === 'users') {
        const { data: activeUsers, error: activeError } = await supabase
          .from('trainers')
          .select('*, clubs(name)')
          .order('created_at', { ascending: false });
          
        if (activeError) throw activeError;

        // Try to fetch deleted users, but don't fail if table doesn't exist
        const { data: deletedUsers, error: deletedError } = await supabase
          .from('deleted_trainers')
          .select('*')
          .order('deleted_at', { ascending: false });

        if (deletedError) {
          console.warn('Could not fetch deleted_trainers:', deletedError);
          // If table missing, just show empty list but warn user
          if (deletedError.code === '42P01') { // undefined_table
             setError('Table "deleted_trainers" missing. Please run the migration script.');
          }
        }

        setData({
          active: activeUsers || [],
          deleted: deletedUsers || []
        });
      } else if (activeTab === 'raw') {
        // Just fetch some raw tables for inspection
        const { data: clubs } = await supabase.from('clubs').select('*');
        const { data: trainers } = await supabase.from('trainers').select('*');
        setData({ clubs, trainers });
      }
    } catch (err: any) {
      console.error('Dev panel fetch error:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !isDev) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 text-xs font-bold px-2 py-1 rounded">DEV MODE</div>
            <h2 className="text-xl font-mono font-bold">System Internals</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 font-mono">{trainer.email}</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 p-2 flex gap-2 bg-gray-50">
          <button
            onClick={() => { setActiveTab('activity'); setData(null); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
              activeTab === 'activity' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <Activity size={16} />
            Recent Activity
          </button>
          <button
            onClick={() => { setActiveTab('stats'); setData(null); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
              activeTab === 'stats' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <Database size={16} />
            System Stats
          </button>
          <button
            onClick={() => { setActiveTab('users'); setData(null); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
              activeTab === 'users' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <Users size={16} />
            User Analytics
          </button>
          <button
            onClick={() => { setActiveTab('raw'); setData(null); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
              activeTab === 'raw' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <FileJson size={16} />
            Raw Data
          </button>
          <div className="flex-1" />
          <button 
            onClick={fetchData}
            className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading system data...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">⚠️</div>
              <div>
                <h3 className="font-bold">Error loading data</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'activity' && Array.isArray(data) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Last 50 Training Entries</h3>
                  <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-gray-600 font-medium border-b">
                        <tr>
                          <th className="p-3">Time</th>
                          <th className="p-3">Club</th>
                          <th className="p-3">Trainer</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.map((entry: any) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="p-3 text-gray-500 font-mono text-xs">
                              {new Date(entry.created_at).toLocaleString('de-CH')}
                            </td>
                            <td className="p-3 font-medium text-blue-600">
                              {entry.clubs?.name || 'Unknown Club'}
                            </td>
                            <td className="p-3">{entry.trainer_name}</td>
                            <td className="p-3">{entry.training_date}</td>
                            <td className="p-3 text-gray-500 italic">{entry.remark || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && data?.clubs && (
                <div className="space-y-8">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Total Clubs</div>
                      <div className="text-4xl font-bold text-gray-900">{data.totalClubs}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Active Trainers</div>
                      <div className="text-4xl font-bold text-gray-900">{data.totalTrainers}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        + {data.deletedTrainers} deleted
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Total Entries</div>
                      <div className="text-4xl font-bold text-gray-900">{data.totalEntries}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Entries (30d)</div>
                      <div className="text-4xl font-bold text-blue-600">{data.recentEntries}</div>
                    </div>
                  </div>

                  {/* Club Breakdown */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Club Statistics</h3>
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 font-medium border-b">
                          <tr>
                            <th className="p-3">Club Name</th>
                            <th className="p-3">City</th>
                            <th className="p-3 text-right">Trainers</th>
                            <th className="p-3 text-right">Slug</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.clubs.map((club: any) => (
                            <tr key={club.id} className="hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-900">{club.name}</td>
                              <td className="p-3 text-gray-600">{club.city}</td>
                              <td className="p-3 text-right font-mono font-bold text-blue-600">
                                {club.trainerCount}
                              </td>
                              <td className="p-3 text-right text-gray-400 font-mono text-xs">
                                {club.slug}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && data?.active && (
                <div className="space-y-8">
                  {/* Active Users */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <UserCheck className="text-green-600" size={24} />
                      <h3 className="text-lg font-bold text-gray-800">Active Users ({data.active.length})</h3>
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 font-medium border-b">
                          <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Club</th>
                            <th className="p-3">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.active.map((user: any) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-900">{user.name}</td>
                              <td className="p-3 text-gray-600 font-mono text-xs">{user.email}</td>
                              <td className="p-3 text-blue-600">{user.clubs?.name || 'Unknown'}</td>
                              <td className="p-3 text-gray-500 text-xs">
                                {new Date(user.created_at).toLocaleDateString('de-CH')}
                              </td>
                            </tr>
                          ))}
                          {data.active.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-gray-400">No active users found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Deleted Users */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <UserX className="text-red-600" size={24} />
                      <h3 className="text-lg font-bold text-gray-800">Deleted Users ({data.deleted.length})</h3>
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-red-50 text-red-800 font-medium border-b border-red-100">
                          <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Club (at deletion)</th>
                            <th className="p-3">Deleted At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.deleted.map((user: any) => (
                            <tr key={user.id} className="hover:bg-red-50/30">
                              <td className="p-3 font-medium text-gray-900">{user.name}</td>
                              <td className="p-3 text-gray-600 font-mono text-xs">{user.email}</td>
                              <td className="p-3 text-gray-600">{user.club_name || 'Unknown'}</td>
                              <td className="p-3 text-red-600 text-xs font-medium">
                                {new Date(user.deleted_at).toLocaleString('de-CH')}
                              </td>
                            </tr>
                          ))}
                          {data.deleted.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-gray-400">No deleted users recorded yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'raw' && data?.clubs && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Clubs Table</h3>
                    <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
                      <pre className="p-4 text-xs font-mono text-gray-600">
                        {JSON.stringify(data.clubs, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Trainers Table</h3>
                    <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
                      <pre className="p-4 text-xs font-mono text-gray-600">
                        {JSON.stringify(data.trainers, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
