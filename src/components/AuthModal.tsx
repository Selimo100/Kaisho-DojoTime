import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { loginTrainer, registerTrainer, checkTrainerIsAdmin } from '../lib/supabaseService';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import Modal from './ui/Modal';
import Button from './ui/Button';

const inputClass =
  'w-full px-3 py-2 bg-white border border-kaisho-greyLight rounded-lg text-gray-800 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kaisho-blueLight/40 focus:border-kaisho-blueLight transition-colors';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

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
  const { loginAsAdmin } = useAdmin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login - Trainer kann sich bei jedem Club einloggen und eintragen
        const trainer = await loginTrainer(email, password);
        
        login(trainer);
        
        // Prüfe ob Trainer auch Admin ist und logge automatisch ein
        try {
          const adminData = await checkTrainerIsAdmin(email, password);
          if (adminData) {
            loginAsAdmin(adminData);
          }
        } catch (adminErr) {
          // Admin-Check fehlgeschlagen ist ok, Trainer ist dann einfach kein Admin
          console.log('No admin privileges found');
        }
        
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
    <Modal
      title={isLogin ? 'Anmelden' : 'Registrieren'}
      subtitle={`Verein: ${clubName}`}
      icon={<LogIn className="w-5 h-5" />}
      maxWidth="max-w-md"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            form="auth-form"
            disabled={isLoading}
            icon={<LogIn className="w-4 h-4" />}
          >
            {isLoading ? 'Lädt…' : isLogin ? 'Anmelden' : 'Registrieren'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className={labelClass}>Benutzername</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!isLogin}
              placeholder="Ihr Name"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className={labelClass}>E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="trainer@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Passwort</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Mindestens 6 Zeichen"
            className={inputClass}
          />
        </div>
      </form>

      <div className="mt-5 text-center">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="text-sm text-kaisho-blue hover:text-kaisho-blueLight font-medium underline underline-offset-2 transition-colors"
        >
          {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
        </button>
      </div>
    </Modal>
  );
}
