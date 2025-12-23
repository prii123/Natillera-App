'use client';

import { useEffect, useState } from 'react';
import { fetchAPI, formatCurrency } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { NatilleraProvider, useNatillera } from '@/contexts/NatilleraContext';
import Navbar from '@/components/Navbar';
import { User } from '@/types';

interface Aporte {
  id: number;
  amount: number;
  user_id: number;
  natillera_id: number;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
  updated_at: string;
  user: User;
}

function AportesPageContent() {
  const { natillera, user, userRole, isLoading, error } = useNatillera();
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [loadingAportes, setLoadingAportes] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');

  // Generar los próximos 12 meses en formato YYYY-MM
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  function getNext12Months() {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = date.getFullYear();
      const monthNum = date.getMonth() + 1;
      const value = { month: monthNum, year };
      const label = monthNames[monthNum - 1] + ' ' + year;
      months.push({ value, label });
    }
    return months;
  }
  const monthOptions = getNext12Months();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const isCreator = userRole === 'creator';

  // Skeletons
  const SkeletonBox = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  // Cargar aportes cuando natillera esté disponible
  useEffect(() => {
    if (natillera && user) {
      loadAportes();
    }
  }, [natillera, user, selectedMonth]);

  const loadAportes = async () => {
    if (!natillera || !user) return;
    setLoadingAportes(true);
    try {
      let res;
      if (isCreator) {
        res = await fetchAPI(`/aportes/natillera/${natillera.id}`);
      } else {
        res = await fetchAPI(`/aportes/my-aportes?natillera_id=${natillera.id}`);
      }
      if (res.ok) {
        const data = await res.json();
        setAportes(data);
      }
    } catch (error) {
      console.error('Error loading aportes:', error);
    } finally {
      setLoadingAportes(false);
    }
  };

  const handleCreateAporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!natillera) return;

    const parsedAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    try {
      const response = await fetchAPI('/aportes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          natillera_id: natillera.id,
          amount: parsedAmount,
          month: selectedMonth.month,
          year: selectedMonth.year
        })
      });

      if (response.ok) {
        toast.success('Aporte registrado exitosamente');
        setAmount('');
        setSelectedMonth(monthOptions[0].value);
        setShowForm(false);
        loadAportes();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al registrar aporte');
      }
    } catch (error) {
      toast.error('Error al registrar aporte');
    }
  };



  if (isLoading || loadingAportes) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <SkeletonBox className="h-10 w-32 mb-4" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !natillera || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{error || 'Natillera no encontrada'}</div>
      </div>
    );
  }

  // const pendientes = aportes.filter((a) => a.status === 'pendiente');
  const aprobados = aportes.filter((a) => a.status === 'aprobado');
  // const rechazados = aportes.filter((a) => a.status === 'rechazado');

  const misAportes = aportes.filter((a) => a.user_id === user!.id && a.status === 'pendiente');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar>
        {natillera && (
          <>
            {isCreator && (
              <Link
                href={`/natilleras/${natillera.id}/transacciones`}
                className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-secondary/90 hover:text-white transition-colors group"
                title="Transacciones"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">💳</span>
                <span className="text-xs font-semibold mt-1">Transacciones</span>
              </Link>
            )}
            <Link
              href={`/natilleras/${natillera.id}/prestamos`}
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-accent/90 hover:text-white transition-colors group"
              title="Préstamos"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💸</span>
              <span className="text-xs font-semibold mt-1">Préstamos</span>
            </Link>
            <Link
              href={`/natilleras/${natillera.id}`}
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-primary/90 hover:text-white transition-colors group"
              title="Volver a Natillera"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🏠</span>
              <span className="text-xs font-semibold mt-1">Natillera</span>
            </Link>
          </>
        )}
      </Navbar>
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h1 className="text-3xl font-bold">💰 Aportes - {natillera?.name}</h1>
          <p className="text-gray-600 mt-2">
            Monto mensual sugerido: {formatCurrency(natillera?.monthly_amount || 0)}
          </p>
        </div>

        {/* Botón registrar aporte */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {showForm ? '✖ Cancelar' : '➕ Registrar Aporte'}
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Registrar Nuevo Aporte</h2>
            <form onSubmit={handleCreateAporte} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej: 50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mes
                </label>
                <select
                  value={`${selectedMonth.month}-${selectedMonth.year}`}
                  onChange={e => {
                    const [m, y] = e.target.value.split('-');
                    setSelectedMonth({ month: parseInt(m), year: parseInt(y) });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {monthOptions.map((m) => (
                    <option key={`${m.value.month}-${m.value.year}`} value={`${m.value.month}-${m.value.year}`}>{m.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Registrar Aporte
              </button>
            </form>
          </div>
        )}

        {/* Mis Aportes */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-2xl font-bold mb-4">📝 Mis Aportes Pendientes ({misAportes.length})</h2>
          {misAportes.length === 0 ? (
            <p className="text-gray-500">No tienes aportes pendientes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {misAportes.map((aporte) => (
                    <tr key={aporte.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {new Date(aporte.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(aporte.amount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${aporte.status === 'aprobado'
                              ? 'bg-green-100 text-green-800'
                              : aporte.status === 'rechazado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                          {aporte.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Aportes aprobados */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-2xl font-bold mb-4">✅ Aportes Aprobados ({aprobados.length})</h2>
          {aprobados.length === 0 ? (
            <p className="text-gray-500">No hay aportes aprobados aún</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {aprobados.map((aporte) => (
                    <tr key={aporte.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {aporte.user.full_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(aporte.amount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {new Date(aporte.created_at).toLocaleDateString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AportesPage({ params }: { params: { id: string } }) {
  return (
    <NatilleraProvider>
      <AportesPageContent />
    </NatilleraProvider>
  );
}

