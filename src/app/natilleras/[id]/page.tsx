
"use client";
import CreadorView from '@/components/natilleras/CreadorView';
import MiembroView from '@/components/natilleras/MiembroView';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { fetchAPI, formatCurrency } from '@/lib/api';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { calcularAportesTotales } from '@/lib/calculosNatillera';
import type { Natillera, Aporte, User } from '@/types';

interface Balance {
  efectivo: number;
  prestamos: number;
  ingresos: number;
  gastos: number;
  capital_disponible: number;
}

// Next.js App Router: params siempre es un objeto síncrono
export default function NatilleraDetallePage() {
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [natillera, setNatillera] = useState<Natillera | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loadingHeader, setLoadingHeader] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [aportesPendientes, setAportesPendientes] = useState<Aporte[]>([]);
  const [loadingAportes, setLoadingAportes] = useState(true);
  const [aportes, setAportes] = useState<Aporte[]>([]);

  // Cargar aportes según el rol y estadísticas de miembro
  useEffect(() => {
    if (!natillera) return;
    const fetchAportesYEstadisticas = async () => {
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
        // Estadísticas solo para miembros
        if (!isCreator) {
          setLoadingEstadisticas(true);
          const estRes = await fetchAPI(`/natilleras/${natillera.id}/estadisticas`);
          if (estRes.ok) {
            const estData = await estRes.json();
            setEstadisticas(estData);
          } else {
            setEstadisticas(null);
          }
          setLoadingEstadisticas(false);
        }
        // Balance
        const ress = await fetchAPI(`/transacciones/natilleras/${natillera.id}/balance`);
        if (ress.ok) {
          const data = await ress.json();
          setBalance(data);
        } else {
          setBalance(null);
        }
      } catch (error) {
        setBalance(null);
        setEstadisticas(null);
        setLoadingEstadisticas(false);
      }
      setLoadingBalance(false);
    };
    fetchAportesYEstadisticas();
  }, [isCreator, natillera]);






  // Cargar aportes pendientes solo para el creador
  useEffect(() => {
    if (!isCreator || !natillera) return;
    setLoadingAportes(true);
    const fetchPendientes = async () => {
      try {
        const res = await fetchAPI(`/aportes/natillera/${natillera.id}`);
        if (res.ok) {
          const data = await res.json();
          setAportesPendientes(data.filter((a: Aporte) => a.status === 'pendiente'));
        }
      } catch (error) { }
      setLoadingAportes(false);
    };
    fetchPendientes();
    // eslint-disable-next-line
  }, [isCreator, natillera]);

  // Refrescar aportes pendientes tras aprobar/rechazar
  const refreshAportesPendientes = async () => {
    if (!isCreator || !natillera) return;
    setLoadingAportes(true);
    try {
      const res = await fetchAPI(`/aportes/natillera/${natillera.id}`);
      if (res.ok) {
        const data = await res.json();
        setAportesPendientes(data.filter((a: Aporte) => a.status === 'pendiente'));
      }
    } catch (error) { }
    setLoadingAportes(false);
  };

  const handleApproveAporte = async (aporteId: number) => {
    try {
      const res = await fetchAPI(`/aportes/${aporteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: { status: 'aprobado' }
      });
      if (res.ok) {
        toast.success('Aporte aprobado');
        refreshAportesPendientes();
      } else {
        toast.error('Error al aprobar aporte');
      }
    } catch (error) {
      toast.error('Error al aprobar aporte');
    }
  };

  const handleRejectAporte = async (aporteId: number) => {
    try {
      const res = await fetchAPI(`/aportes/${aporteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: { status: 'rechazado' }
      });
      if (res.ok) {
        toast.success('Aporte rechazado');
        refreshAportesPendientes();
      } else {
        toast.error('Error al rechazar aporte');
      }
    } catch (error) {
      toast.error('Error al rechazar aporte');
    }
  };


  // Cargar datos de usuario y natillera al iniciar sesión
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
      } else {
        setLoadingHeader(true);
        try {
          const [userRes, natilleraRes] = await Promise.all([
            fetchAPI('/users/me'),
            fetchAPI(`/natilleras/${id}`)
          ]);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData);
            if (natilleraRes.ok) {
              const natilleraData = await natilleraRes.json();
              setNatillera(natilleraData);
              setIsCreator(natilleraData.creator_id === userData.id);
              setLoadingMembers(false);
            } else {
              setLoadingMembers(false);
            }
          } else {
            setLoadingMembers(false);
          }
        } catch (error) {
          setLoadingMembers(false);
        }
        setLoadingHeader(false);
      }
    });
    return () => unsubscribe();
  }, [id, router]);

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
          <div className="p-6 rounded-2xl shadow-lg mb-6 border border-blue-400 bg-blue-50">
            <div className="flex items-center gap-4 mb-2">
              <SkeletonBox className="h-10 w-10" />
              <SkeletonBox className="h-8 w-48" />
            </div>
            <div className="space-y-2 ml-1">
              <SkeletonBox className="h-5 w-40" />
              <SkeletonBox className="h-5 w-32" />
              <SkeletonBox className="h-5 w-44" />
              <SkeletonBox className="h-4 w-32" />
            </div>
            <div className="mt-6 flex flex-col md:flex-row gap-4">
              <SkeletonBox className="h-12 w-full md:w-1/2" />
              <SkeletonBox className="h-12 w-full md:w-1/2" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!natillera) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Natillera no encontrada</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
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
          </>
        )}
      </Navbar>
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="p-6 rounded-2xl shadow-lg mb-6 border border-blue-400 bg-blue-50">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl text-blue-500">🪙</span>
            <h1 className="text-3xl font-extrabold drop-shadow tracking-tight text-blue-900">{natillera.name}</h1>
          </div>
          <div className="space-y-1 ml-1">
            <p>
              <span className="font-medium text-blue-900">Monto mensual:</span>{' '}
              <span className="font-semibold text-blue-900">{formatCurrency(parseFloat(natillera.monthly_amount))}</span>
            </p>
            <p>
              <span className="font-medium text-blue-900">Estado:</span>{' '}
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide border shadow-sm uppercase ${natillera.estado === 'activo' ? 'bg-green-100 text-green-900 border-green-400' : 'bg-gray-200 text-gray-900 border-gray-400'}`}
              >
                {natillera.estado}
              </span>
            </p>
            <p>
              <span className="font-medium text-blue-900">Creador:</span> <span className="font-semibold text-blue-900">{natillera.creator.full_name}</span>
            </p>
            <p className="text-sm text-blue-800">
              Creada el {new Date(natillera.created_at).toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>
        {/* Vista de Creador o Miembro */}
        {isCreator ? (
          <CreadorView
            natillera={{
              ...natillera,
              aportesPendientes,
              onApproveAporte: handleApproveAporte,
              onRejectAporte: handleRejectAporte,
              aportesTotales: calcularAportesTotales(natillera, aportes),
            }}
            balance={balance}
            loadingBalance={loadingBalance}
            loadingMembers={loadingMembers}
            SkeletonBox={SkeletonBox}
            loadingAportes={loadingAportes}
          />
        ) : (
          <MiembroView
            natillera={natillera}
            estadisticas={estadisticas}
            loadingEstadisticas={loadingEstadisticas}
            balance={balance}
            loadingBalance={loadingBalance}
            SkeletonBox={SkeletonBox}
          />
        )}
      </main>
    </div>
  );
}

