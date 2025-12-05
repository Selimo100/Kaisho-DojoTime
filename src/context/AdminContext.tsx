import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Admin } from '../types';

interface AdminContextType {
  admin: Admin | null;
  loginAsAdmin: (admin: Admin) => void;
  logoutAdmin: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Token-Gültigkeitsdauer: 1 Woche in Millisekunden
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const stored = localStorage.getItem('kaisho_admin');
    const timestamp = localStorage.getItem('kaisho_admin_timestamp');
    
    if (stored && timestamp) {
      const storedTime = parseInt(timestamp, 10);
      const now = Date.now();
      
      // Prüfe ob Token noch gültig ist (1 Woche)
      if (now - storedTime < TOKEN_EXPIRY_MS) {
        return JSON.parse(stored);
      } else {
        // Token abgelaufen
        localStorage.removeItem('kaisho_admin');
        localStorage.removeItem('kaisho_admin_timestamp');
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (admin) {
      localStorage.setItem('kaisho_admin', JSON.stringify(admin));
      // Nur Timestamp setzen wenn noch keiner existiert (bei neuem Login)
      if (!localStorage.getItem('kaisho_admin_timestamp')) {
        localStorage.setItem('kaisho_admin_timestamp', Date.now().toString());
      }
    } else {
      localStorage.removeItem('kaisho_admin');
      localStorage.removeItem('kaisho_admin_timestamp');
    }
  }, [admin]);

  const loginAsAdmin = (adminData: Admin) => {
    setAdmin(adminData);
    localStorage.setItem('kaisho_admin_timestamp', Date.now().toString());
  };

  const logoutAdmin = () => {
    setAdmin(null);
  };

  const value: AdminContextType = {
    admin,
    loginAsAdmin,
    logoutAdmin,
    isAdmin: !!admin,
    isSuperAdmin: admin?.is_super_admin || false,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
