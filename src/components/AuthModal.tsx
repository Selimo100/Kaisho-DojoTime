import { useState } from 'react';
import { KeyRound, LogIn } from 'lucide-react';
import { loginTrainer, registerTrainer, checkTrainerIsAdmin, resetTrainerPassword } from '../lib/supabaseService';
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
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login } = useAuth();
  const { loginAsAdmin } = useAdmin();
  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isReset = mode === 'reset';

  const switchMode = (nextMode: 'login' | 'register' | 'reset') => {
    setMode(nextMode);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
    if (nextMode !== 'register') {
      setName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
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
      } else if (isRegister) {
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
      } else {
        if (password.length < 6) {
          setError('Das neue Passwort muss mindestens 6 Zeichen lang sein');
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Die Passwörter stimmen nicht überein');
          setIsLoading(false);
          return;
        }

        await resetTrainerPassword(email, clubId, password);
        setSuccessMessage('Passwort erfolgreich zurückgesetzt. Sie können sich jetzt mit dem neuen Passwort anmelden.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
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
      title={isLogin ? 'Anmelden' : isRegister ? 'Registrieren' : 'Passwort zurücksetzen'}
      subtitle={`Verein: ${clubName}`}
      icon={isReset ? <KeyRound className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
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
            icon={isReset ? <KeyRound className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          >
            {isLoading ? 'Lädt…' : isLogin ? 'Anmelden' : isRegister ? 'Registrieren' : 'Passwort speichern'}
          </Button>
        </>
      }
    >
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className={labelClass}>Benutzername</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isRegister}
              placeholder="Vorname Nachname"
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
          <label className={labelClass}>{isReset ? 'Neues Passwort' : 'Passwort'}</label>
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

        {isReset && (
          <div>
            <label className={labelClass}>Neues Passwort wiederholen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Passwort erneut eingeben"
              className={inputClass}
            />
          </div>
        )}
      </form>

      <div className="mt-5 text-center">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => switchMode(isLogin ? 'register' : 'login')}
            className="text-sm text-kaisho-blue hover:text-kaisho-blueLight font-medium underline underline-offset-2 transition-colors"
          >
            {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
          </button>

          <button
            onClick={() => switchMode(isReset ? 'login' : 'reset')}
            className="text-sm text-kaisho-blue hover:text-kaisho-blueLight font-medium underline underline-offset-2 transition-colors"
          >
            {isReset ? 'Zurück zur Anmeldung' : 'Passwort vergessen?'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
