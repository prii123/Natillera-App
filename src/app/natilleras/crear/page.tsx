'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';

interface User {
  id: number;
  full_name: string;
}

export default function CrearNatilleraPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    monthly_amount: ''
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
      } else {
        await loadUserData();
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetchAPI('/natilleras/', {
        method: 'POST',
        body: {
          name: formData.name,
          monthly_amount: parseFloat(formData.monthly_amount)
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Natillera creada exitosamente');
        router.push(`/natilleras/${data.id}`);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al crear la natillera');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear la natillera');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-2xl">🪙</span>
                <span className="text-xl font-bold text-green-600">Natillera</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                Hola, {user?.full_name || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
              ← Volver
            </button>
          </Link>
          <h1 className="text-3xl font-bold">Crear Nueva Natillera</h1>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Natillera
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ej: Natillera Familia García"
              />
            </div>

            <div>
              <label htmlFor="monthly_amount" className="block text-sm font-medium text-gray-700 mb-2">
                Monto Mensual (COP)
              </label>
              <input
                type="number"
                id="monthly_amount"
                required
                step="0.01"
                min="0"
                value={formData.monthly_amount}
                onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ej: 100000"
              />
              <p className="mt-2 text-sm text-gray-500">
                Este será el monto que cada miembro debe aportar mensualmente
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : '✓ Crear Natillera'}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Información importante</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Serás el creador y administrador de esta natillera</li>
              <li>• Podrás invitar miembros después de crearla</li>
              <li>• Podrás gestionar aportes, préstamos y transacciones</li>
              <li>• El estado inicial será "Activo"</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
