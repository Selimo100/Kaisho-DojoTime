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

  useEffect(() => {
    // Load trainer from localStorage on mount
    const storedTrainer = localStorage.getItem('trainer');
    if (storedTrainer) {
      try {
        setTrainer(JSON.parse(storedTrainer));
      } catch (e) {
        localStorage.removeItem('trainer');
      }
    }
  }, []);

  const login = (trainer: Trainer) => {
    setTrainer(trainer);
    localStorage.setItem('trainer', JSON.stringify(trainer));
  };

  const logout = () => {
    setTrainer(null);
    localStorage.removeItem('trainer');
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
