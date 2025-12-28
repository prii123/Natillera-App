"use client";
import CreadorView from '@/components/natilleras/CreadorView';
import MiembroView from '@/components/natilleras/MiembroView';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI, formatCurrency } from '@/lib/api';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useInvalidateNotifications } from '@/hooks/useNotifications';
import { NatilleraProvider, useNatillera } from '@/contexts/NatilleraContext';
import FileViewerModal from '@/components/FileViewerModal';

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

interface ArchivoAdjunto {
  id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano: number;
  fecha_subida: string;
}

interface Aporte {
  id: number;
  amount: number;
  user_id: number;
  natillera_id: number;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
  updated_at: string;
  user: User;
  archivos_adjuntos?: ArchivoAdjunto[];
}

interface Balance {
  efectivo: number;
  prestamos: number;
  ingresos: number;
  gastos: number;
  capital_disponible: number;
}

// Función para calcular el total de aportes aprobados por usuario
const calcularAportesTotales = (natillera: any, aportes: Aporte[]) => {
  const aportesAprobados = aportes.filter(aporte => aporte.status === 'aprobado');

  // Agrupar aportes por usuario
  const aportesPorUsuario = aportesAprobados.reduce((acc, aporte) => {
    const userId = aporte.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        user: aporte.user,
        totalAportado: 0
      };
    }
    acc[userId].totalAportado += aporte.amount;
    return acc;
  }, {} as Record<number, { user: User; totalAportado: number }>);

  // Calcular el total general
  const totalGeneral = Object.values(aportesPorUsuario).reduce((sum, item) => sum + item.totalAportado, 0);

  // Calcular porcentajes y devolver array
  return Object.values(aportesPorUsuario).map(item => ({
    user: item.user,
    totalAportado: item.totalAportado,
    porcentaje: totalGeneral > 0 ? (item.totalAportado / totalGeneral) * 100 : 0
  }));
};

function NatilleraPageContent() {
  const { natillera, userRole, isLoading, error } = useNatillera();
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);
  const router = useRouter();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [aportesPendientes, setAportesPendientes] = useState<Aporte[]>([]);
  const [loadingAportes, setLoadingAportes] = useState(true);
  const [aportes, setAportes] = useState<Aporte[]>([]);

  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedAporteFiles, setSelectedAporteFiles] = useState<ArchivoAdjunto[]>([]);

  const invalidateNotifications = useInvalidateNotifications();

  const isCreator = userRole === 'creator';

  // Calcular aportes totales usando useMemo para que se actualice cuando cambien los aportes
  const aportesTotales = useMemo(() => {
    const aportesAprobados = aportes.filter(aporte => aporte.status === 'aprobado');

    // Agrupar aportes por usuario
    const aportesPorUsuario = aportesAprobados.reduce((acc, aporte) => {
      const userId = aporte.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user: aporte.user,
          totalAportado: 0
        };
      }
      acc[userId].totalAportado += Number(aporte.amount);
      return acc;
    }, {} as Record<number, { user: User; totalAportado: number }>);

    // Calcular el total general
    const totalGeneral = Object.values(aportesPorUsuario).reduce((sum, item) => sum + item.totalAportado, 0);

    // Calcular porcentajes y devolver array
    const result = Object.values(aportesPorUsuario).map(item => ({
      user: item.user,
      totalAportado: item.totalAportado,
      porcentaje: totalGeneral > 0 ? (item.totalAportado / totalGeneral) * 100 : 0
    }));

    return result;
  }, [aportes]);

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
          // Cargar archivos adjuntos para cada aporte pendiente
          const aportesConArchivos = await Promise.all(
            data.filter((a: Aporte) => a.status === 'pendiente').map(async (aporte: Aporte) => {
              try {
                const archivosRes = await fetchAPI(`/archivos_adjuntos/aporte/${aporte.id}`);
                if (archivosRes.ok) {
                  const archivos = await archivosRes.json();
                  return { ...aporte, archivos_adjuntos: archivos };
                }
                return aporte;
              } catch (error) {
                return aporte;
              }
            })
          );
          setAportesPendientes(aportesConArchivos);
        }
      } catch (error) { }
      setLoadingAportes(false);
    };
    fetchPendientes();
  }, [isCreator, natillera]);

  // Refrescar aportes pendientes tras aprobar/rechazar
  const refreshAportesPendientes = async () => {
    if (!isCreator || !natillera) return;
    setLoadingAportes(true);
    try {
      const res = await fetchAPI(`/aportes/natillera/${natillera.id}`);
      if (res.ok) {
        const data = await res.json();
        // Cargar archivos adjuntos para cada aporte pendiente
        const aportesConArchivos = await Promise.all(
          data.filter((a: Aporte) => a.status === 'pendiente').map(async (aporte: Aporte) => {
            try {
              const archivosRes = await fetchAPI(`/archivos_adjuntos/aporte/${aporte.id}`);
              if (archivosRes.ok) {
                const archivos = await archivosRes.json();
                return { ...aporte, archivos_adjuntos: archivos };
              }
              return aporte;
            } catch (error) {
              return aporte;
            }
          })
        );
        setAportesPendientes(aportesConArchivos);
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
        // Invalidar notificaciones para actualizar el contador
        invalidateNotifications();
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
        // Invalidar notificaciones para actualizar el contador
        invalidateNotifications();
      } else {
        toast.error('Error al rechazar aporte');
      }
    } catch (error) {
      toast.error('Error al rechazar aporte');
    }
  };

  const handleViewFiles = (archivos: ArchivoAdjunto[]) => {
    setSelectedAporteFiles(archivos);
    setShowFileModal(true);
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      const res = await fetchAPI(`/archivos_adjuntos/${fileId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Archivo eliminado');
        // Refrescar los aportes pendientes para actualizar la lista de archivos
        refreshAportesPendientes();
        setShowFileModal(false);
      } else {
        toast.error('Error al eliminar archivo');
      }
    } catch (error) {
      toast.error('Error al eliminar archivo');
    }
  };

  // Skeletons
  const SkeletonBox = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  if (isLoading) {
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

  if (error || !natillera) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{error || 'Natillera no encontrada'}</div>
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
              <span className="font-semibold text-blue-900">{formatCurrency(natillera.monthly_amount)}</span>
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
              aportesTotales: aportesTotales,
              onViewFiles: handleViewFiles,
              onDeleteFile: handleDeleteFile,
            }}
            balance={balance}
            loadingBalance={loadingBalance}
            loadingMembers={false} // Ya manejado por el contexto
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

      {/* Modal de archivos */}
      {showFileModal && selectedAporteFiles.length > 0 && (
        <FileViewerModal
          isOpen={showFileModal}
          archivos={selectedAporteFiles}
          onClose={() => setShowFileModal(false)}
          onDeleteFile={handleDeleteFile}
          canDelete={true}
        />
      )}
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  return (
    <NatilleraProvider>
      <NatilleraPageContent />
    </NatilleraProvider>
  );
}

