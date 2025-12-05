import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Trainer {
  id: string;
  email: string;
  name: string;
  club_id: string;
}

interface AuthContextType {
  trainer: Trainer | null;
  login: (trainer: Trainer) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [trainer, setTrainer] = useState<Trainer | null>(null);

  // Token-Gültigkeitsdauer: 1 Woche in Millisekunden
  const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    // Load trainer from localStorage on mount
    const storedTrainer = localStorage.getItem('trainer');
    const storedTimestamp = localStorage.getItem('trainer_timestamp');
    
    if (storedTrainer && storedTimestamp) {
      try {
        const timestamp = parseInt(storedTimestamp, 10);
        const now = Date.now();
        
        // Prüfe ob Token noch gültig ist (1 Woche)
        if (now - timestamp < TOKEN_EXPIRY_MS) {
          setTrainer(JSON.parse(storedTrainer));
        } else {
          // Token abgelaufen, entfernen
          localStorage.removeItem('trainer');
          localStorage.removeItem('trainer_timestamp');
        }
      } catch (e) {
        localStorage.removeItem('trainer');
        localStorage.removeItem('trainer_timestamp');
      }
    }
  }, []);

  const login = (trainer: Trainer) => {
    setTrainer(trainer);
    localStorage.setItem('trainer', JSON.stringify(trainer));
    localStorage.setItem('trainer_timestamp', Date.now().toString());
  };

  const logout = () => {
    setTrainer(null);
    localStorage.removeItem('trainer');
    localStorage.removeItem('trainer_timestamp');
  };

  const value = {
    trainer,
    login,
    logout,
    isAuthenticated: !!trainer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
