import { useState } from 'react';
import { loginAdmin } from '../lib/supabaseService';
import { useAdmin } from '../context/AdminContext';

interface AdminLoginModalProps {
  onClose: () => void;
}

export default function AdminLoginModal({ onClose }: AdminLoginModalProps) {
  const { loginAsAdmin } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const adminData = await loginAdmin({ email, password });
      
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
    <div className="fixed inset-0 bg-kaisho-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-gradient-to-br from-kaisho-darkPanel via-kaisho-blueDark to-kaisho-darkPanel rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-kaisho-blueLight/30">
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
          <div className="mb-4 p-3 md:p-4 bg-kaisho-red/20 backdrop-blur-sm border border-kaisho-red/50 text-kaisho-redLight rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-kaisho-darkPanel/50 backdrop-blur-sm border border-kaisho-blueLight/30 rounded-xl text-white placeholder-kaisho-greyLight/50 focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
              placeholder="E-Mail-Adresse eingeben"
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
              className="w-full px-4 py-3 bg-kaisho-darkPanel/50 backdrop-blur-sm border border-kaisho-blueLight/30 rounded-xl text-white placeholder-kaisho-greyLight/50 focus:ring-2 focus:ring-kaisho-blueLight focus:border-kaisho-blueLight transition-all"
              placeholder="Passwort eingeben"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 md:py-4 px-4 bg-gradient-to-r from-kaisho-blueLight to-kaisho-blue hover:from-kaisho-blue hover:to-kaisho-blueLight text-white rounded-xl transition-all font-bold text-base md:text-lg shadow-lg shadow-kaisho-blueLight/20 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Anmelden...' : '✓ Als Admin anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
