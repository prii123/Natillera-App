'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { fetchAPI, formatCurrency } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';

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

interface Invitacion {
  id: number;
  natillera_id: number;
  invitado_id: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  created_at: string;
  natillera: Natillera;
  inviter_user: User;
}

export default function InvitacionesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
      } else {
        await loadUserData();
        await loadInvitaciones();
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
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  const loadInvitaciones = async () => {
    try {
      const response = await fetchAPI('/invitaciones/');
      if (response.ok) {
        const data = await response.json();
        setInvitaciones(data);
      }
    } catch (error) {
      console.error('Error cargando invitaciones:', error);
    }
  };

  const handleAccept = async (invitacionId: number) => {
    if (!confirm('¿Deseas unirte a esta natillera?')) return;

    try {
      const response = await fetchAPI(`/invitaciones/${invitacionId}/accept`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Te has unido a la natillera exitosamente');
        await loadInvitaciones();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al aceptar la invitación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar la invitación');
    }
  };

  const handleReject = async (invitacionId: number) => {
    if (!confirm('¿Deseas rechazar esta invitación?')) return;

    try {
      const response = await fetchAPI(`/invitaciones/${invitacionId}/reject`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Invitación rechazada');
        await loadInvitaciones();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al rechazar la invitación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar la invitación');
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
      {/* Navbar */}

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Invitaciones Pendientes</h1>
        </div>

        {invitaciones.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">No tienes invitaciones pendientes</h3>
            <p className="text-gray-600">Cuando alguien te invite a una natillera, aparecerá aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {invitaciones.map((invitacion) => (
              <div key={invitacion.id} className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                  {invitacion.natillera.name}
                </h3>
                <div className="space-y-2 text-gray-600 mb-4">
                  <p>
                    <span className="font-medium">Invitado por:</span>{' '}
                    {invitacion.inviter_user.full_name} (@{invitacion.inviter_user.username})
                  </p>
                  <p>
                    <span className="font-medium">Monto mensual:</span>{' '}
                    {formatCurrency(invitacion.natillera.monthly_amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Invitación recibida el{' '}
                    {new Date(invitacion.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(invitacion.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    ✓ Aceptar
                  </button>
                  <button
                    onClick={() => handleReject(invitacion.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    ✗ Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
