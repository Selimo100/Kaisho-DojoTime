import { useState } from 'react';
import { loginAdmin } from '../lib/supabaseService';
import { useAdmin } from '../context/AdminContext';

interface AdminLoginModalProps {
  onClose: () => void;
}

export default function AdminLoginModal({ onClose }: AdminLoginModalProps) {
  const { loginAsAdmin } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const adminData = await loginAdmin({ username, password });
      
      if (!adminData) {
        setError('Ungültige Anmeldedaten');
        return;
      }

      loginAsAdmin(adminData);
      onClose();
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Fehler bei der Anmeldung');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-blue-400/30">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">🔐 Admin-Anmeldung</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all active:scale-95"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 md:p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Benutzername
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 md:py-4 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all font-bold text-base md:text-lg shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Anmelden...' : '✓ Als Admin anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
