"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
// Remove these imports: import { db, testConnection } from '@/lib/db';
// Remove these imports: import { getInitialSemesters, getInitialStudents, getInitialRequests, getInitialUsers } from '@/lib/data';

interface DatabaseContextType {
  isConnected: boolean;
  isSeeding: boolean;
  seedingComplete: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingComplete, setSeedingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeDatabase() {
      try {
        setIsSeeding(true);
        setError(null);

        // Call API endpoint instead of direct database access
        const response = await fetch('/api/database/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Database initialization failed');
        }

        const result = await response.json();
        
        setIsConnected(result.connected);
        if (result.connected && result.seedingComplete) {
          setSeedingComplete(true);
        } else if (!result.connected) {
          setError('Failed to connect to database');
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Database initialization error:', err);
        setIsConnected(false);
      } finally {
        setIsSeeding(false);
      }
    }

    initializeDatabase();
  }, []);

  const value: DatabaseContextType = {
    isConnected,
    isSeeding,
    seedingComplete,
    error
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

// Optional: Database status component
export function DatabaseStatus() {
  const { isConnected, isSeeding, seedingComplete, error } = useDatabase();

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">Database Error: {error}</p>
      </div>
    );
  }

  if (isSeeding) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800">🔄 Initializing database...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">⚠️ Database not connected</p>
      </div>
    );
  }

  if (seedingComplete) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-green-800">✅ Database ready</p>
      </div>
    );
  }

  return null;
}