import { useState, type ReactNode } from 'react';
import { AuthContext } from './authContextValue';

const STORAGE_KEY = 'shrine_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === 'authenticated'
  );

  const login = (password: string): boolean => {
    const correct = import.meta.env.VITE_AUTH_PASSWORD;
    if (password === correct) {
      localStorage.setItem(STORAGE_KEY, 'authenticated');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
