'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { fetchAPI, formatCurrency } from '@/lib/api';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  created_at: string;
}

interface Natillera {
  id: number;
  name: string;
  monthly_amount: number;
  creator_id: number;
  created_at: string;
  estado: 'activo' | 'inactivo';
  creator: User;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [natilleras, setNatilleras] = useState<Natillera[]>([]);
  const [invitacionesCount, setInvitacionesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
      } else {
        await loadUserData();
        await loadNatilleras();
        await loadInvitacionesCount();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadUserData = async () => {
    try {
      const response = await fetchAPI('/users/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  const loadNatilleras = async () => {
    try {
      const response = await fetchAPI('/natilleras/activas');
      if (response.ok) {
        const data = await response.json();
        setNatilleras(data);
      }
    } catch (error) {
      console.error('Error cargando natilleras:', error);
    }
  };

  const loadInvitacionesCount = async () => {
    try {
      const response = await fetchAPI('/invitaciones/count');
      if (response.ok) {
        const data = await response.json();
        setInvitacionesCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error cargando invitaciones:', error);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
         {/* Sección de invitación a la app oficial */}
      <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">¿Quieres unirte a Natillera App oficial?</h2>
            <p className="text-blue-100">Descubre todas las funciones premium y únete a la comunidad oficial</p>
          </div>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Unirme ahora
          </button>
        </div>
      </div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Natilleras Activas</h1>
          <Link href="/natilleras/crear">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              + Crear Natillera
            </button>
          </Link>
        </div>

        {natilleras.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">No tienes natilleras activas</h3>
            <p className="text-gray-600 mb-6">Crea una natillera o acepta una invitación para comenzar</p>
            <Link href="/natilleras/crear">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Crear mi primera natillera
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {natilleras.map((natillera) => (
              <Link key={natillera.id} href={`/natilleras/${natillera.id}`}>
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">
                    {natillera.name}
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>
                      <span className="font-medium">Monto mensual:</span>{' '}
                      {formatCurrency(natillera.monthly_amount)}
                    </p>
                    <p>
                      <span className="font-medium">Estado:</span>{' '}
                      <span
                        className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                          natillera.estado === 'activo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {natillera.estado}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Creador:</span>{' '}
                      {natillera.creator.full_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Creada el {new Date(natillera.created_at).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <div className="mt-4 text-green-600 font-medium flex items-center">
                    Ver detalles
                    <span className="ml-2">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
