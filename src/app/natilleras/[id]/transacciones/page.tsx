'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { fetchAPI, formatCurrency } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

interface Creador {
  email: string;
  username: string;
  full_name: string;
  id: number;
  created_at: string;
}

interface Transaccion {
  id: number;
  natillera_id: number;
  tipo: 'efectivo' | 'prestamo' | 'pago_prestamos' | 'pago_prestamo_pendiente' | 'ingreso' | 'gasto';
  categoria: string;
  monto: string;
  descripcion: string;
  fecha: string;
  creado_por: number;
  aporte_id: number | null;
  prestamo_id: number | null;
  created_at: string;
  creador: Creador;
  miembro: Creador | null;
}

interface Balance {
  efectivo: number;
  prestamos: number;
  ingresos: number;
  gastos: number;
  capital_disponible: number;
}

interface Natillera {
  id: number;
  name: string;
  creator_id: number;
}

export default function TransaccionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [natillera, setNatillera] = useState<Natillera | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loadingHeader, setLoadingHeader] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTransacciones, setLoadingTransacciones] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'efectivo' | 'prestamo' | 'pago_prestamos' | 'pago_prestamo_pendiente' | 'ingreso' | 'gasto'>('ingreso');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
      } else {
        await loadHeader();
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [id, router]);

  // Cargar cabecera y natillera
  const loadHeader = async () => {
    setLoadingHeader(true);
    setLoadingBalance(true);
    setLoadingTransacciones(true);
    try {
      const [userRes, natilleraRes] = await Promise.all([
        fetchAPI('/users/me'),
        fetchAPI(`/natilleras/${id}`)
      ]);
      if (userRes.ok) {
        const userData = await userRes.json();
        if (natilleraRes.ok) {
          const natilleraData = await natilleraRes.json();
          setNatillera(natilleraData);
          setIsCreator(natilleraData.creator_id === userData.id);
        }
      }
      setLoadingHeader(false);
      // Balance y transacciones se cargan aparte
      loadBalance();
      loadTransacciones();
    } catch (error) {
      setLoadingHeader(false);
      setLoadingBalance(false);
      setLoadingTransacciones(false);
    }
  };

  // Cargar balance por separado
  const loadBalance = async () => {
    setLoadingBalance(true);
    try {
      const balanceRes = await fetchAPI(`/transacciones/natilleras/${id}/balance`);
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData);
      }
      setLoadingBalance(false);
    } catch (error) {
      setLoadingBalance(false);
    }
  };

  // Cargar transacciones por separado
  const loadTransacciones = async () => {
    setLoadingTransacciones(true);
    try {
      const transaccionesRes = await fetchAPI(`/transacciones/natilleras/${id}/transacciones`);
      if (transaccionesRes.ok) {
        const transaccionesData = await transaccionesRes.json();
        setTransacciones(transaccionesData);
      }
      setLoadingTransacciones(false);
    } catch (error) {
      setLoadingTransacciones(false);
    }
  };

  const handleCreateTransaccion = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }


    if (!category.trim()) {
      toast.error('Ingresa una categoría');
      return;
    }
    if (!description.trim()) {
      toast.error('Ingresa una descripción');
      return;
    }

    try {
      const payload = {
        natillera_id: parseInt(id),
        tipo: type,
        categoria: category.trim(),
        monto: parsedAmount,
        descripcion: description.trim()
      };
    //   console.log('Payload enviado a /transacciones/:', payload);
      const response = await fetchAPI('/transacciones/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });

      if (response.ok) {
        toast.success('Transacción registrada exitosamente');
        setCategory('');
        setAmount('');
        setDescription('');
        setShowForm(false);
        // Recargar datos progresivamente
        await Promise.all([
          loadHeader(),
          loadBalance(),
          loadTransacciones()
        ]);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al registrar transacción');
      }
    } catch (error) {
      toast.error('Error al registrar transacción');
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('token');
    router.push('/');
  };


  // Skeletons
  const SkeletonBox = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  if (loadingHeader) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="bg-gradient-to-r from-primary to-secondary shadow-md text-white h-16" />
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <SkeletonBox className="h-10 w-32 mb-4" />
          </div>
          <div className="p-6 rounded-xl shadow-lg mb-6 border">
            <SkeletonBox className="h-8 w-80 mb-2" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" >
      <Navbar>
        {isCreator && natillera && (
          <>
            <Link
              href={`/natilleras/${natillera.id}/transacciones`}
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-secondary/90 hover:text-white transition-colors group"
              title="Transacciones"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💳</span>
              <span className="text-xs font-semibold mt-1">Transacciones</span>
            </Link>
            <Link
              href={`/natilleras/${natillera.id}/prestamos`}
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-accent/90 hover:text-white transition-colors group"
              title="Préstamos"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💸</span>
              <span className="text-xs font-semibold mt-1">Préstamos</span>
            </Link>
          </>
        )}
      </Navbar>
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

        <div
          className="p-6 rounded-xl shadow-lg mb-6 border"
          style={{ background: 'linear-gradient(135deg, var(--color-surface) 60%, var(--color-secondary) 100%)', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary-dark)' }}
        >
          <h1 className="text-3xl font-bold drop-shadow">💳 Balance y Transacciones - {natillera?.name}</h1>
        </div>

        {/* Balance Skeleton o real */}
        {loadingBalance ? (
          <div className="p-6 rounded-xl shadow-lg mb-6 border">
            <SkeletonBox className="h-7 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border bg-gray-100 border-gray-200 flex flex-col gap-2">
                  <SkeletonBox className="h-4 w-24" />
                  <SkeletonBox className="h-8 w-20" />
                  <SkeletonBox className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : balance && (
          <div
            className="p-6 rounded-xl shadow-lg mb-6 border"
            style={{ background: 'linear-gradient(135deg, var(--color-surface) 60%, var(--color-secondary) 100%)', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary-dark)' }}
          >
            <h2 className="text-2xl font-bold mb-4 drop-shadow">📊 Balance General</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg border" style={{ background: 'var(--color-secondary)', borderColor: 'var(--color-secondary-dark)', color: 'var(--color-surface)' }}>
                <div className="text-sm mb-1">💵 Efectivo Total</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(balance.efectivo)}
                </div>
                <div className="text-xs mt-1">Aportes aprobados</div>
              </div>
              <div className="p-4 rounded-lg border" style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent-dark)', color: 'var(--color-surface)' }}>
                <div className="text-sm mb-1">💰 Préstamos</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(balance.prestamos)}
                </div>
                <div className="text-xs mt-1">Dinero prestado</div>
              </div>
              <div className="p-4 rounded-lg border" style={{ background: 'var(--color-primary)', borderColor: 'var(--color-primary-dark)', color: 'var(--color-surface)' }}>
                <div className="text-sm mb-1">📈 Ingresos</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(balance.ingresos)}
                </div>
                <div className="text-xs mt-1">Intereses y otros</div>
              </div>
              <div className="p-4 rounded-lg border" style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger-dark)', color: 'var(--color-surface)' }}>
                <div className="text-sm mb-1">📉 Gastos</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(balance.gastos)}
                </div>
                <div className="text-xs mt-1">Costos operativos</div>
              </div>
              <div className="p-4 rounded-lg border" style={{ background: '#ede9fe', borderColor: '#a78bfa', color: '#6d28d9' }}>
                <div className="text-sm mb-1">🏦 Capital Disponible</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(balance.capital_disponible)}
                </div>
                <div className="text-xs mt-1">Capital neto</div>
              </div>
            </div>
          </div>
        )}

        {/* Botón crear transacción (solo creador) */}
        {isCreator && (
          <div className="mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {showForm ? '✖ Cancelar' : '➕ Registrar Transacción'}
            </button>
          </div>
        )}

        {/* Formulario */}
        {showForm && isCreator && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Registrar Nueva Transacción</h2>
            <form onSubmit={handleCreateTransaccion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'efectivo' | 'prestamo' | 'pago_prestamos' | 'pago_prestamo_pendiente' | 'ingreso' | 'gasto')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej: Intereses, Comisión, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
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
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el motivo de la transacción"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Registrar Transacción
              </button>
            </form>
          </div>
        )}

        {/* Lista de transacciones */}
        <div
          className="p-6 rounded-xl shadow-md border bg-white border-secondary"
        >
          <h2 className="text-2xl font-bold mb-4">📋 Historial de Transacciones {loadingTransacciones ? '' : `(${transacciones.length})`}</h2>
          {loadingTransacciones ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <SkeletonBox className="h-5 w-24" />
                  <SkeletonBox className="h-5 w-20" />
                  <SkeletonBox className="h-5 w-40" />
                  <SkeletonBox className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : transacciones.length === 0 ? (
            <p style={{ color: 'var(--color-muted)' }}>No hay transacciones registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transacciones.map((transaccion) => {
                    let text = '', icon = '';
                    if (transaccion.tipo === 'ingreso') {
                      text = 'text-green-900'; icon = '📈';
                    } else if (transaccion.tipo === 'gasto') {
                      text = 'text-red-900'; icon = '📉';
                    } else if (transaccion.tipo === 'efectivo') {
                      text = 'text-blue-900'; icon = '💵';
                    } else if (transaccion.tipo === 'prestamo' || transaccion.tipo === 'pago_prestamos' || transaccion.tipo === 'pago_prestamo_pendiente') {
                      text = 'text-yellow-900'; icon = '💰';
                    } else {
                      text = 'text-gray-900'; icon = '💸';
                    }
                    // Calcular monto numérico seguro
                    let montoNum = 0;
                    if (typeof transaccion.monto === 'number') {
                      montoNum = transaccion.monto;
                    } else if (typeof transaccion.monto === 'string') {
                      const parsed = parseFloat(transaccion.monto);
                      montoNum = Number.isFinite(parsed) ? parsed : 0;
                    }
                    return (
                      <tr key={transaccion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaccion.fecha || transaccion.created_at).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center gap-1 ${text}`}>
                            <span>{icon}</span>
                            <span className="capitalize">
                              {transaccion.tipo === 'ingreso' && 'Ingreso'}
                              {transaccion.tipo === 'gasto' && 'Gasto'}
                              {transaccion.tipo === 'efectivo' && 'Efectivo'}
                              {transaccion.tipo === 'prestamo' && 'Préstamo'}
                              {transaccion.tipo === 'pago_prestamos' && 'Pago Préstamo'}
                              {transaccion.tipo === 'pago_prestamo_pendiente' && 'Pago Pendiente'}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaccion.categoria || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {transaccion.descripcion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                          <span className={text}>
                            {(transaccion.tipo === 'ingreso' || transaccion.tipo === 'efectivo' || transaccion.tipo === 'pago_prestamos' || transaccion.tipo === 'pago_prestamo_pendiente') ? '+' : '-'} {formatCurrency(montoNum)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaccion.miembro?.full_name || transaccion.creador?.full_name || 'Sistema'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
