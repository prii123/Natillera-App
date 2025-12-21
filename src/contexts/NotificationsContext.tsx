'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationCounts {
  aportesPendientes: number;
  prestamosPendientes: number;
  pagosPendientes: number;
  invitacionesRespondidas: number;
  aportesAprobados: number;
  prestamosAprobados: number;
  pagosAprobados: number;
  total: number;
}

interface NotificationsContextType {
  counts: NotificationCounts;
  loading: boolean;
  isCreator: boolean;
  refetch: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<NotificationCounts>({
    aportesPendientes: 0,
    prestamosPendientes: 0,
    pagosPendientes: 0,
    invitacionesRespondidas: 0,
    aportesAprobados: 0,
    prestamosAprobados: 0,
    pagosAprobados: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);

  // Esta función será implementada por el hook useNotifications
  const refetch = async () => {
    // La implementación real estará en el hook
  };

  return (
    <NotificationsContext.Provider value={{ counts, loading, isCreator, refetch }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
}