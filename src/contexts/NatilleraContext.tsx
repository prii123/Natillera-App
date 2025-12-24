'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  firebase_uid?: string;
}

interface Natillera {
  id: number;
  name: string;
  monthly_amount: number;
  creator_id: number;
  estado: 'activo' | 'inactivo';
  created_at: string;
  creator: User;
  members: User[];
}

interface NatilleraContextType {
  natillera: Natillera | null;
  user: User | null;
  userRole: 'creator' | 'member' | null;
  isLoading: boolean;
  error: string | null;
  refreshNatillera: () => Promise<void>;
}

const NatilleraContext = createContext<NatilleraContextType | undefined>(undefined);

interface NatilleraProviderProps {
  children: ReactNode;
}

export function NatilleraProvider({ children }: NatilleraProviderProps) {
  const [natillera, setNatillera] = useState<Natillera | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'creator' | 'member' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const { firebaseUser, loading: authLoading } = useAuth();

  const natilleraId = params?.id as string;

  const loadNatilleraData = async () => {
    if (!natilleraId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Verificar autenticación
      if (!firebaseUser) {
        router.push('/login');
        return;
      }

      // Obtener datos del usuario actual
      const userRes = await fetchAPI('/users/me');
      if (!userRes.ok) {
        setError('Error al obtener datos del usuario');
        return;
      }
      const userData = await userRes.json();
      setUser(userData);

      // Obtener datos de la natillera
      const natilleraRes = await fetchAPI(`/natilleras/${natilleraId}`);
      if (!natilleraRes.ok) {
        if (natilleraRes.status === 404) {
          setError('Natillera no encontrada');
        } else if (natilleraRes.status === 403) {
          setError('No tienes acceso a esta natillera');
        } else {
          setError('Error al cargar la natillera');
        }
        return;
      }

      const natilleraData = await natilleraRes.json();
      setNatillera(natilleraData);

      // Determinar el rol del usuario
      const isCreator = natilleraData.creator_id === userData.id;

      if (isCreator) {
        setUserRole('creator');
      } else {
        // Si no es creador pero pudo acceder a la natillera, es miembro
        setUserRole('member');
      }

    } catch (err) {
      console.error('Error loading natillera data:', err);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNatillera = async () => {
    await loadNatilleraData();
  };

  useEffect(() => {
    if (!authLoading && firebaseUser && natilleraId) {
      loadNatilleraData();
    } else if (!authLoading && !firebaseUser) {
      router.push('/login');
    }
  }, [natilleraId, firebaseUser, authLoading]);

  // Escuchar cambios de autenticación
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      setNatillera(null);
      setUser(null);
      setUserRole(null);
      setIsLoading(false);
    }
  }, [firebaseUser, authLoading]);

  const value: NatilleraContextType = {
    natillera,
    user,
    userRole,
    isLoading,
    error,
    refreshNatillera,
  };

  return (
    <NatilleraContext.Provider value={value}>
      {children}
    </NatilleraContext.Provider>
  );
}

export function useNatillera() {
  const context = useContext(NatilleraContext);
  if (context === undefined) {
    throw new Error('useNatillera must be used within a NatilleraProvider');
  }
  return context;
}