'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI, formatCurrency } from '@/lib/api';
import { toast } from 'sonner';
import { NatilleraProvider, useNatillera } from '@/contexts/NatilleraContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

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

function TransaccionesPageContent() {
  const { natillera, userRole, isLoading, error, refreshNatillera } = useNatillera();
  const router = useRouter();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTransacciones, setLoadingTransacciones] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'efectivo' | 'prestamo' | 'pago_prestamos' | 'pago_prestamo_pendiente' | 'ingreso' | 'gasto'>('ingreso');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterMontoMin, setFilterMontoMin] = useState('');
  const [filterMontoMax, setFilterMontoMax] = useState('');
  const [filterUsuario, setFilterUsuario] = useState<string>('todos');

  const isCreator = userRole === 'creator';

  // Función para filtrar transacciones
  const getFilteredTransacciones = () => {
    return transacciones.filter(transaccion => {
      // Filtro por tipo
      if (filterTipo !== 'todos' && transaccion.tipo !== filterTipo) {
        return false;
      }

      // Filtro por fecha desde
      if (filterFechaDesde) {
        const fechaTransaccion = new Date(transaccion.fecha || transaccion.created_at);
        const fechaFiltro = new Date(filterFechaDesde);
        if (fechaTransaccion < fechaFiltro) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (filterFechaHasta) {
        const fechaTransaccion = new Date(transaccion.fecha || transaccion.created_at);
        const fechaFiltro = new Date(filterFechaHasta);
        fechaFiltro.setHours(23, 59, 59, 999); // Fin del día
        if (fechaTransaccion > fechaFiltro) {
          return false;
        }
      }

      // Filtro por monto mínimo
      if (filterMontoMin) {
        const montoMin = parseFloat(filterMontoMin);
        let montoTransaccion = 0;
        if (typeof transaccion.monto === 'number') {
          montoTransaccion = transaccion.monto;
        } else if (typeof transaccion.monto === 'string') {
          montoTransaccion = parseFloat(transaccion.monto) || 0;
        }
        if (montoTransaccion < montoMin) {
          return false;
        }
      }

      // Filtro por monto máximo
      if (filterMontoMax) {
        const montoMax = parseFloat(filterMontoMax);
        let montoTransaccion = 0;
        if (typeof transaccion.monto === 'number') {
          montoTransaccion = transaccion.monto;
        } else if (typeof transaccion.monto === 'string') {
          montoTransaccion = parseFloat(transaccion.monto) || 0;
        }
        if (montoTransaccion > montoMax) {
          return false;
        }
      }

      // Filtro por usuario
      if (filterUsuario !== 'todos') {
        const usuarioTransaccion = transaccion.miembro?.full_name || transaccion.creador?.full_name || 'Sistema';
        if (usuarioTransaccion !== filterUsuario) {
          return false;
        }
      }

      return true;
    });
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilterTipo('todos');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setFilterMontoMin('');
    setFilterMontoMax('');
    setFilterUsuario('todos');
  };

  // Obtener lista de usuarios únicos para el filtro
  const getUniqueUsers = () => {
    const users = new Set<string>();
    transacciones.forEach(transaccion => {
      const userName = transaccion.miembro?.full_name || transaccion.creador?.full_name || 'Sistema';
      users.add(userName);
    });
    return Array.from(users).sort();
  };

  // Cargar balance y transacciones cuando natillera esté disponible
  useEffect(() => {
    if (natillera) {
      loadBalance();
      loadTransacciones();
    }
  }, [natillera]);

  // Cargar balance
  const loadBalance = async () => {
    if (!natillera) return;
    setLoadingBalance(true);
    try {
      const balanceRes = await fetchAPI(`/transacciones/natilleras/${natillera.id}/balance`);
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData);
      }
      setLoadingBalance(false);
    } catch (error) {
      setLoadingBalance(false);
    }
  };

  // Cargar transacciones
  const loadTransacciones = async () => {
    if (!natillera) return;
    setLoadingTransacciones(true);
    try {
      const transaccionesRes = await fetchAPI(`/transacciones/natilleras/${natillera.id}/transacciones`);
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
    if (!natillera) return;

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
        natillera_id: natillera!.id,
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
        await refreshNatillera();
        loadBalance();
        loadTransacciones();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al registrar transacción');
      }
    } catch (error) {
      toast.error('Error al registrar transacción');
    }
  };

  // Skeletons
  const SkeletonBox = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
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

  if (error || !natillera) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{error || 'Natillera no encontrada'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" >
      <Navbar>
        {natillera && (
          <>
            <Link
              href={`/natilleras/${natillera!.id}/prestamos`}
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-accent/90 hover:text-white transition-colors group"
              title="Préstamos"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💸</span>
              <span className="text-xs font-semibold mt-1">Préstamos</span>
            </Link>
            <Link
              href={`/natilleras/${natillera!.id}`}
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

        <div
          className="p-6 rounded-xl shadow-lg mb-6 border"
          style={{ background: 'linear-gradient(135deg, var(--color-surface) 60%, var(--color-secondary) 100%)', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary-dark)' }}
        >
          <h1 className="text-3xl font-bold drop-shadow">💳 Balance y Transacciones - {natillera!.name}</h1>
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
                  {formatCurrency(Math.round(balance.efectivo))}
                </div>
                <div className="text-xs mt-1">Aportes aprobados</div>
              </div>
              <div className="p-4 rounded-lg border" style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent-dark)', color: 'var(--color-surface)' }}>
                <div className="text-sm mb-1">💰 Préstamos</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(Math.round(balance.prestamos))}
                </div>
                <div className="text-xs mt-1">Dinero prestado</div>
              </div>
              <div className="p-4 rounded-lg border" style={{ background: 'var(--color-primary)', borderColor: 'var(--color-primary-dark)', color: 'var(--color-surface)' }}>
                <div className="text-sm mb-1">📈 Ingresos</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(Math.round(balance.ingresos))}
                </div>
                <div className="text-xs mt-1">Intereses y otros</div>
              </div>
              <div className="p-4 rounded-lg border" style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger-dark)', color: 'var(--color-surface)' }}>
                <div className="text-sm mb-1">📉 Gastos</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(Math.round(balance.gastos))}
                </div>
                <div className="text-xs mt-1">Costos operativos</div>
              </div>
              <div className="p-4 rounded-lg border" style={{ background: '#ede9fe', borderColor: '#a78bfa', color: '#6d28d9' }}>
                <div className="text-sm mb-1">🏦 Capital Disponible</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(Math.round(balance.capital_disponible))}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">📋 Historial de Transacciones {loadingTransacciones ? '' : `(${getFilteredTransacciones().length})`}</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>🔍</span>
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
                {/* Filtro por tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="ingreso">Ingreso</option>
                    <option value="gasto">Gasto</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="prestamo">Préstamo</option>
                    <option value="pago_prestamos">Pago Préstamo</option>
                    <option value="pago_prestamo_pendiente">Pago Pendiente</option>
                  </select>
                </div>

                {/* Filtro por fecha desde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={filterFechaDesde}
                    onChange={(e) => setFilterFechaDesde(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Filtro por fecha hasta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={filterFechaHasta}
                    onChange={(e) => setFilterFechaHasta(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Filtro por monto mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Mínimo
                  </label>
                  <input
                    type="number"
                    value={filterMontoMin}
                    onChange={(e) => setFilterMontoMin(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Filtro por monto máximo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Máximo
                  </label>
                  <input
                    type="number"
                    value={filterMontoMax}
                    onChange={(e) => setFilterMontoMax(e.target.value)}
                    placeholder="999999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Filtro por usuario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario
                  </label>
                  <select
                    value={filterUsuario}
                    onChange={(e) => setFilterUsuario(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="todos">Todos</option>
                    {getUniqueUsers().map(user => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones de acción para filtros */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={clearFilters}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}

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
          ) : getFilteredTransacciones().length === 0 ? (
            <p style={{ color: 'var(--color-muted)' }}>
              {transacciones.length === 0 
                ? 'No hay transacciones registradas' 
                : 'No hay transacciones que coincidan con los filtros aplicados'
              }
            </p>
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
                  {getFilteredTransacciones().map((transaccion) => {
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

export default function TransaccionesPage() {
  return (
    <NatilleraProvider>
      <TransaccionesPageContent />
    </NatilleraProvider>
  );
}
