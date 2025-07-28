
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, Role, UserInDb } from '@/lib/types';
import { getInitialUsers } from '@/lib/data';

type Theme = "light" | "dark";

interface AuthContextType {
  user: User | null;
  users: UserInDb[];
  loading: boolean;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: Role) => void;
  customLogoUrl: string | null;
  setCustomLogo: (url: string | null) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAuth()
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users] = useState<UserInDb[]>(getInitialUsers());
  const [loading, setLoading] = useState(true);
  const [customLogoUrl, setCustomLogoUrlState] = useState<string | null>(null);
  const [theme, setThemeState] = useState<Theme>('light');
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedLogo = localStorage.getItem('customLogoUrl');
      if(storedLogo) {
        setCustomLogoUrlState(storedLogo);
      }
       const storedTheme = localStorage.getItem('app-theme') as Theme | null;
       if (storedTheme) {
         setThemeState(storedTheme);
       }
    } catch (error) {
      console.error("Failed to parse from storage", error);
      sessionStorage.removeItem('user');
      localStorage.removeItem('customLogoUrl');
      localStorage.removeItem('app-theme');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string): Promise<boolean> => {
    const userInDb = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    
    // NOTE: In a real app, you'd also check a password.
    // For this project, we only check the username.
    if (userInDb) {
      const sessionUser: User = {
        id: userInDb.id,
        username: userInDb.username,
        name: userInDb.name,
        roles: userInDb.roles,
        activeRole: userInDb.roles[0], // Default to the first role
      };
      sessionStorage.setItem('user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      router.push('/dashboard');
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const switchRole = (role: Role) => {
    if (user && user.roles.includes(role)) {
      const updatedUser = { ...user, activeRole: role };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      // We don't need to force a redirect here, the UI should react to the state change.
      // If a specific page needs to reload, it can do so.
    }
  };

  const setCustomLogo = (url: string | null) => {
    setCustomLogoUrlState(url);
    if (url) {
      localStorage.setItem('customLogoUrl', url);
    } else {
      localStorage.removeItem('customLogoUrl');
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
  }

  const value = { user, users, loading, login, logout, switchRole, customLogoUrl, setCustomLogo, theme, setTheme };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
