'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import { NatilleraProvider, useNatillera } from '@/contexts/NatilleraContext';

interface Politica {
  id: number;
  titulo: string;
  descripcion: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

function ConfigurarPoliticasPageContent() {
  const { natillera, userRole, isLoading, error } = useNatillera();
  const router = useRouter();
  const [politicas, setPoliticas] = useState<Politica[]>([]);
  const [loadingPoliticas, setLoadingPoliticas] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPolitica, setEditingPolitica] = useState<Politica | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    orden: 0
  });
  const [saving, setSaving] = useState(false);

  const isCreator = userRole === 'creator';

  // Redirigir si no es creador
  useEffect(() => {
    if (!isLoading && userRole && userRole !== 'creator') {
      router.push(`/natilleras/${natillera?.id}/politicas`);
    }
  }, [userRole, isLoading, router, natillera]);

  // Cargar políticas cuando natillera esté disponible
  useEffect(() => {
    if (natillera && isCreator) {
      loadPoliticas();
    }
  }, [natillera, isCreator]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.descripcion.trim()) return;

    setSaving(true);
    try {
      const data = {
        ...formData,
        natillera_id: natillera!.id,
        orden: politicas.length + 1
      };

      let response;
      if (editingPolitica) {
        response = await fetchAPI(`/politicas/${editingPolitica.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        response = await fetchAPI('/politicas/', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }

      if (response.ok) {
        await loadPoliticas();
        resetForm();
      } else {
        console.error('Error saving politica');
      }
    } catch (error) {
      console.error('Error saving politica:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (politica: Politica) => {
    setEditingPolitica(politica);
    setFormData({
      titulo: politica.titulo,
      descripcion: politica.descripcion,
      orden: politica.orden
    });
    setShowForm(true);
  };

  const handleDelete = async (politicaId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta política?')) return;

    try {
      const response = await fetchAPI(`/politicas/${politicaId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadPoliticas();
      } else {
        console.error('Error deleting politica');
      }
    } catch (error) {
      console.error('Error deleting politica:', error);
    }
  };

  const resetForm = () => {
    setFormData({ titulo: '', descripcion: '', orden: 0 });
    setEditingPolitica(null);
    setShowForm(false);
  };

  if (isLoading || loadingPoliticas) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando configuración...</div>
      </div>
    );
  }

  if (error || !natillera) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Natillera no encontrada'}</div>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">No tienes permisos para acceder a esta página.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurar Políticas</h1>
              <p className="mt-2 text-gray-600">
                {natillera?.name} - Gestiona las reglas y normativas
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/natilleras/${natillera!.id}/politicas`}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Ver Políticas
              </Link>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {showForm ? 'Cancelar' : 'Nueva Política'}
              </button>
            </div>
          </div>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingPolitica ? 'Editar Política' : 'Nueva Política'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ej: Obligaciones de los miembros"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Describe detalladamente la política..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : (editingPolitica ? 'Actualizar' : 'Crear')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Políticas */}
        <div className="space-y-4">
          {politicas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay políticas creadas
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu primera política para establecer las reglas de la natillera.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear primera política
              </button>
            </div>
          ) : (
            politicas
              .sort((a, b) => a.orden - b.orden)
              .map((politica, index) => (
                <div
                  key={politica.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          {politica.titulo}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(politica)}
                          className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(politica.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-white p-2 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {politica.descripcion}
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>

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

export default function ConfigurarPoliticasPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <NatilleraProvider>
      <ConfigurarPoliticasPageContent />
    </NatilleraProvider>
  );
}