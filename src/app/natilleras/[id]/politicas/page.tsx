'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import { NatilleraProvider, useNatillera } from '@/contexts/NatilleraContext';
import Navbar from '@/components/Navbar';

interface Politica {
  id: number;
  titulo: string;
  descripcion: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

function PoliticasPageContent() {
  const { natillera, userRole, isLoading, error } = useNatillera();
  const [politicas, setPoliticas] = useState<Politica[]>([]);
  const [loadingPoliticas, setLoadingPoliticas] = useState(true);

  const isCreator = userRole === 'creator';

  // Cargar políticas cuando natillera esté disponible
  useEffect(() => {
    if (natillera) {
      loadPoliticas();
    }
  }, [natillera]);

  const loadPoliticas = async () => {
    if (!natillera) return;
    setLoadingPoliticas(true);
    try {
      const politicasRes = await fetchAPI(`/politicas/natillera/${natillera.id}`);
      if (politicasRes.ok) {
        const politicasData = await politicasRes.json();
        setPoliticas(politicasData);
      }
    } catch (error) {
      console.error('Error loading politicas:', error);
    } finally {
      setLoadingPoliticas(false);
    }
  };

  if (isLoading || loadingPoliticas) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando políticas...</div>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar>
        {natillera && (
          <>
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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Políticas de Ahorro</h1>
              <p className="mt-2 text-gray-600">
                {natillera?.name} - Reglas y normativas de la natillera
              </p>
            </div>
            {isCreator && (
              <Link
                href={`/natilleras/${natillera!.id}/politicas/configurar`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configurar Políticas
              </Link>
            )}
          </div>
        </div>

        {/* Políticas */}
        {politicas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay políticas definidas
            </h3>
            <p className="text-gray-600 mb-6">
              Las políticas de ahorro ayudan a mantener el orden y las reglas claras en la natillera.
            </p>
            {isCreator && (
              <Link
                href={`/natilleras/${natillera!.id}/politicas/configurar`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear primera política
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {politicas
              .sort((a, b) => a.orden - b.orden)
              .map((politica, index) => (
                <div
                  key={politica.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {politica.titulo}
                      </h3>
                    </div>
                  </div>
                  <div className="px-6 py-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {politica.descripcion}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href={`/natilleras/${natillera!.id}`}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Volver a la natillera
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PoliticasPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <NatilleraProvider>
      <PoliticasPageContent />
    </NatilleraProvider>
  );
}
