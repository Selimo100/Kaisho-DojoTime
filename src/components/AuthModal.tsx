import { useState } from 'react';
import { loginTrainer, registerTrainer } from '../lib/supabaseService';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  clubId: string;
  clubName: string;
  onClose: () => void;
}

export default function AuthModal({ clubId, clubName, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const trainer = await loginTrainer(email, password);
        
        // Prüfe ob Trainer zum richtigen Verein gehört
        if (trainer.club_id !== clubId) {
          setError('Sie gehören nicht zu diesem Verein');
          setIsLoading(false);
          return;
        }
        
        login(trainer);
        onClose();
      } else {
        // Register
        if (!name.trim()) {
          setError('Bitte geben Sie Ihren Namen ein');
          setIsLoading(false);
          return;
        }

        await registerTrainer({
          email,
          name: name.trim(),
          password,
          club_id: clubId,
        });

        // Auto-login after registration
        const trainer = await loginTrainer(email, password);
        login(trainer);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-kaisho-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-gradient-to-br from-kaisho-darkPanel via-kaisho-blueDark to-kaisho-darkPanel rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-kaisho-blueLight/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {isLogin ? '🔐 Anmelden' : '✨ Registrieren'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all active:scale-95"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-white/80 mb-6">
          Verein: <span className="font-bold text-white">{clubName}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 md:p-4 bg-kaisho-red/20 backdrop-blur-sm border border-kaisho-red/50 rounded-xl">
            <p className="text-sm text-kaisho-redLight font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Benutzername *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Ihr Name"
                className="w-full px-4 py-3 bg-kaisho-darkPanel/50 backdrop-blur-sm border border-kaisho-blueLight/30 rounded-xl text-white placeholder-kaisho-greyLight/50 focus:ring-2 focus:ring-kaisho-red focus:border-kaisho-red transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              E-Mail *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="trainer@example.com"
              className="w-full px-4 py-3 bg-kaisho-darkPanel/50 backdrop-blur-sm border border-kaisho-blueLight/30 rounded-xl text-white placeholder-kaisho-greyLight/50 focus:ring-2 focus:ring-kaisho-red focus:border-kaisho-red transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Passwort *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mindestens 6 Zeichen"
              className="w-full px-4 py-3 bg-kaisho-darkPanel/50 backdrop-blur-sm border border-kaisho-blueLight/30 rounded-xl text-white placeholder-kaisho-greyLight/50 focus:ring-2 focus:ring-kaisho-red focus:border-kaisho-red transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 md:py-4 px-4 bg-gradient-to-r from-kaisho-red to-kaisho-redLight hover:from-kaisho-redLight hover:to-kaisho-red text-white rounded-xl transition-all font-bold text-base md:text-lg shadow-lg shadow-kaisho-red/20 active:scale-95 disabled:opacity-50"
          >
            {isLoading
              ? 'Lädt...'
              : isLogin
              ? '✓ Anmelden'
              : '✨ Registrieren'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-white/90 hover:text-white font-semibold underline transition-colors"
          >
            {isLogin
              ? 'Noch kein Konto? Registrieren'
              : 'Bereits registriert? Anmelden'}
          </button>
        </div>
      </div>
    </div>
  );
}
