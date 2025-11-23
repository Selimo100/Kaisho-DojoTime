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

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const stored = localStorage.getItem('kaisho_admin');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (admin) {
      localStorage.setItem('kaisho_admin', JSON.stringify(admin));
    } else {
      localStorage.removeItem('kaisho_admin');
    }
  }, [admin]);

  const loginAsAdmin = (adminData: Admin) => {
    setAdmin(adminData);
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
