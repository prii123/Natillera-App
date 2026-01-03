'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import { Natillera, Sorteo, SorteoFinalizado, BilleteLoteria, User } from '@/types';
import Modal from '@/components/Modal';

export default function SorteosPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'crear' | 'ver' | 'finalizados'>('ver');
  const [natilleras, setNatilleras] = useState<Natillera[]>([]);
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [sorteosFinalizados, setSorteosFinalizados] = useState<any[]>([]);
  const [selectedSorteo, setSelectedSorteo] = useState<Sorteo | null>(null);
  const [billetes, setBilletes] = useState<BilleteLoteria[]>([]);
  const [loadingBilletes, setLoadingBilletes] = useState(false);
  const [adminBilletes, setAdminBilletes] = useState<BilleteLoteria[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBilletesModal, setShowBilletesModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [numeroGanadorManual, setNumeroGanadorManual] = useState('');

  // Form state
  const [tipoSorteo, setTipoSorteo] = useState<'loteria' | 'rifa'>('loteria');
  const [selectedNatillera, setSelectedNatillera] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaSorteo, setFechaSorteo] = useState('');

  useEffect(() => {
    if (user) {
      // Verificar que el token existe antes de hacer llamadas
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        // Pequeño delay para asegurar que la autenticación esté completa
        const timer = setTimeout(() => {
          loadNatilleras();
          loadSorteos();
          loadSorteosFinalizados();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const loadNatilleras = async () => {
    try {
      const response = await fetchAPI('/natilleras/activas'); // Cambiar a /activas como en dashboard
      if (response.ok) {
        const data = await response.json();
        setNatilleras(data);
      }
    } catch (error) {
      console.error('Error cargando natilleras:', error);
    }
  };

  const loadSorteos = async () => {
    try {
      // Assuming endpoint exists
      const response = await fetchAPI('/sorteos/activos');
      if (response.ok) {
        const data = await response.json();
        // console.log('Sorteos recibidos del backend:', data);
        setSorteos(data);
      } else {
        console.error('Error cargando sorteos:', response.status);
      }
    } catch (error) {
      console.error('Error cargando sorteos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSorteosFinalizados = async () => {
    try {
      const response = await fetchAPI('/sorteos/finalizados');
      // console.log('Respuesta de sorteos finalizados:', response.status, response.body);
      if (response.ok) {
        const data = await response.json();
        setSorteosFinalizados(data || []);
      } else {
        console.error('Error cargando sorteos finalizados:', response.status);
      }
    } catch (error) {
      console.error('Error cargando sorteos finalizados:', error);
    }
  };

  const loadBilletes = async (sorteoId: number) => {
    setLoadingBilletes(true);
    try {
      // console.log('Cargando billetes para sorteo:', sorteoId);
      const response = await fetchAPI(`/sorteos/${sorteoId}/billetes`);
      // console.log('Respuesta de billetes:', response.status, response.statusText);
      if (response.ok) {
        const data = await response.json();
        // console.log('Billetes recibidos:', data);
        setBilletes(data);
      } else {
        console.error('Error cargando billetes:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setBilletes([]);
      }
    } catch (error) {
      console.error('Error cargando billetes:', error);
      setBilletes([]);
    } finally {
      setLoadingBilletes(false);
    }
  };

  const tomarBillete = async (sorteoId: number, numero: string) => {
    try {
      const response = await fetchAPI(`/sorteos/${sorteoId}/billetes/${numero}/tomar`, {
        method: 'POST',
      });
      if (response.ok) {
        // Recargar billetes después de tomar uno
        loadBilletes(sorteoId);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Error tomando billete: ${errorData.detail || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error tomando billete:', error);
      alert('Error tomando billete');
    }
  };

  const handleCreateSorteo = async () => {
    if (!selectedNatillera) {
      alert('Por favor selecciona una natillera');
      return;
    }
    if (!titulo.trim()) {
      alert('Por favor ingresa un título');
      return;
    }

    try {
      // Validar que selectedNatillera sea un número válido
      const natilleraId = parseInt(selectedNatillera.toString());
      if (isNaN(natilleraId)) {
        alert('ID de natillera inválido');
        return;
      }

      // Verificar que el usuario sea el creador de la natillera
      const selectedNatilleraData = natilleras.find(n => n.id === natilleraId);
      if (!selectedNatilleraData) {
        alert('Natillera no encontrada');
        return;
      }
      if (selectedNatilleraData.creator_id !== user?.id) {
        alert('Solo puedes crear sorteos en natilleras que has creado');
        return;
      }

      // Validar campos requeridos
      if (!titulo.trim()) {
        alert('Por favor ingresa un título para el sorteo');
        return;
      }

      const body: any = {
        natillera_id: natilleraId,
        tipo: tipoSorteo,
        titulo: titulo.trim(),
      };

      // Solo incluir descripcion si tiene un valor no vacío
      if (descripcion.trim()) {
        body.descripcion = descripcion.trim();
      }

      // Solo incluir fecha_sorteo si tiene un valor
      if (fechaSorteo) {
        body.fecha_sorteo = fechaSorteo;
      }

      // console.log('Enviando datos al backend:', body);
      // console.log('Token disponible:', !!localStorage.getItem('token'));

      const response = await fetchAPI('/sorteos/', {
        method: 'POST',
        body,
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        loadSorteos();
        alert('Sorteo creado exitosamente!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error creando sorteo:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          sentData: body
        });
        
        let errorMessage = 'Error desconocido al crear el sorteo';
        if (response.status === 401) {
          errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
        } else if (response.status === 403) {
          errorMessage = 'No tienes permisos para crear sorteos en esta natillera.';
        } else if (response.status === 404) {
          errorMessage = 'Natillera no encontrada.';
        } else if (errorData.detail) {
          errorMessage = `Error: ${errorData.detail}`;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error de red:', error);
      let errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setTipoSorteo('loteria');
    setSelectedNatillera(null);
    setTitulo('');
    setDescripcion('');
    setFechaSorteo('');
  };

  const finalizarSorteo = async (sorteo: Sorteo) => {
    setSelectedSorteo(sorteo);
    setNumeroGanadorManual('');
    setShowFinalizarModal(true);
  };

  const confirmarFinalizarSorteo = async () => {
    if (!selectedSorteo) return;

    const numeroGanador = numeroGanadorManual.trim() ? numeroGanadorManual.trim().padStart(3, '0') : undefined;

    try {
      const body: any = {};
      if (numeroGanador !== undefined) {
        body.numero_ganador = numeroGanador;
      }

      const response = await fetchAPI(`/sorteos/${selectedSorteo.id}/finalizar`, {
        method: 'PUT',
        body,
      });

      if (response.ok) {
        const sorteoActualizado = await response.json();
        if (sorteoActualizado.numero_ganador) {
          alert(`¡Sorteo finalizado! El número ganador es: ${sorteoActualizado.numero_ganador}`);
        } else {
          alert('Sorteo finalizado. No hay ganador para este sorteo.');
        }
        setShowFinalizarModal(false);
        loadSorteos(); // Recargar la lista de sorteos activos
        loadSorteosFinalizados(); // Recargar sorteos finalizados
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Error finalizando sorteo: ${errorData.detail || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error finalizando sorteo:', error);
      alert('Error finalizando sorteo');
    }
  };

  const marcarBilletePagado = async (sorteoId: number, numero: string) => {
    try {
      const response = await fetchAPI(`/sorteos/${sorteoId}/billetes/${numero}/marcar-pagado`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Recargar los billetes de admin
        if (selectedSorteo) {
          loadAdminBilletes(selectedSorteo.id);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Error marcando billete como pagado: ${errorData.detail || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error marcando billete como pagado:', error);
      alert('Error marcando billete como pagado');
    }
  };

  const loadAdminBilletes = async (sorteoId: number) => {
    setLoadingAdmin(true);
    try {
      const response = await fetchAPI(`/sorteos/${sorteoId}/billetes/admin`);
      if (response.ok) {
        const data = await response.json();
        setAdminBilletes(data);
        
        // Obtener IDs únicos de usuarios que han tomado billetes
        const userIds: number[] = Array.from(new Set(data
          .filter((b: BilleteLoteria) => b.tomado_por !== null && b.tomado_por !== undefined)
          .map((b: BilleteLoteria) => b.tomado_por as number)
        ));
        if (userIds.length > 0) {
          await loadUsersByIds(userIds);
        }
      } else {
        console.error('Error cargando billetes de admin');
        setAdminBilletes([]);
      }
    } catch (error) {
      console.error('Error cargando billetes de admin:', error);
      setAdminBilletes([]);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const loadUsersByIds = async (userIds: number[]) => {
    try {
      // Para simplificar, vamos a hacer una consulta por cada usuario
      // En un caso real, sería mejor tener un endpoint que acepte múltiples IDs
      const userPromises = userIds.map(async (id) => {
        try {
          const response = await fetchAPI(`/users/${id}`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.error(`Error cargando usuario ${id}:`, error);
        }
        return null;
      });
      
      const usersData = await Promise.all(userPromises);
      const validUsers = usersData.filter(user => user !== null);
      setUsers(validUsers);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  const userNatilleras = natilleras.filter(n => n.creator_id === user?.id);
  const isCreator = userNatilleras.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Sorteos</h1>

      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('ver')}
            className={`px-4 py-2 rounded ${activeTab === 'ver' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Sorteos Activos
          </button>
          <button
            onClick={() => setActiveTab('finalizados')}
            className={`px-4 py-2 rounded ${activeTab === 'finalizados' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Sorteos Finalizados ({sorteosFinalizados.length})
          </button>
          {isCreator && (
            <button
              onClick={() => setActiveTab('crear')}
              className={`px-4 py-2 rounded ${activeTab === 'crear' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Crear Sorteo
            </button>
          )}
        </div>
      </div>

      {activeTab === 'crear' && isCreator && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Crear Nuevo Sorteo</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Crear Sorteo
          </button>
        </div>
      )}

      {activeTab === 'ver' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Sorteos Activos</h2>
          {sorteos.length === 0 ? (
            <p>No hay sorteos activos.</p>
          ) : (
            <div className="space-y-4">
              {sorteos.map((sorteo) => {
                // Buscar la natillera en la lista de natilleras cargadas
                const natillera = natilleras.find(n => n.id === sorteo.natillera_id);
                return (
                  <div key={sorteo.id} className="border p-4 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{sorteo.titulo}</h3>
                        <p>Tipo: {sorteo.tipo}</p>
                        <p>Natillera: {natillera?.name || `Natillera ${sorteo.natillera_id}`}</p>
                        {sorteo.descripcion && <p>{sorteo.descripcion}</p>}
                        {sorteo.fecha_sorteo && <p>Fecha de sorteo: {new Date(sorteo.fecha_sorteo).toLocaleDateString()}</p>}
                        {sorteo.numero_ganador && (
                          <p className="text-green-600 font-bold">¡NÚMERO GANADOR: {sorteo.numero_ganador}!</p>
                        )}
                        <p className={`font-semibold ${sorteo.estado === 'finalizado' ? 'text-red-600' : 'text-green-600'}`}>
                          Estado: {sorteo.estado}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {sorteo.tipo === 'loteria' && sorteo.estado === 'activo' && (
                          <button
                            onClick={() => {
                              setSelectedSorteo(sorteo);
                              loadBilletes(sorteo.id);
                              setShowBilletesModal(true);
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                          >
                            Ver Billetes
                          </button>
                        )}
                        {sorteo.creador_id === user?.id && sorteo.estado === 'activo' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedSorteo(sorteo);
                                loadAdminBilletes(sorteo.id);
                                setShowAdminModal(true);
                              }}
                              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                            >
                              Administrar Billetes
                            </button>
                            <button
                              onClick={() => finalizarSorteo(sorteo)}
                              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                              Finalizar Sorteo
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'finalizados' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Sorteos Finalizados</h2>
          {sorteosFinalizados.length === 0 ? (
            <p>No hay sorteos finalizados.</p>
          ) : (
            <div className="space-y-4">
              {sorteosFinalizados.map((sorteo) => {
                const natillera = natilleras.find(n => n.id === sorteo.natillera_id);
                return (
                  <div key={sorteo.id} className="border p-4 rounded bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{sorteo.titulo}</h3>
                        <p>Tipo: {sorteo.tipo}</p>
                        <p>Natillera: {natillera?.name || `Natillera ${sorteo.natillera_id}`}</p>
                        {sorteo.descripcion && <p>{sorteo.descripcion}</p>}
                        {sorteo.fecha_sorteo && (
                          <p>Fecha de sorteo: {new Date(sorteo.fecha_sorteo).toLocaleDateString()}</p>
                        )}
                        <div className="mt-2">
                          {sorteo.numero_ganador ? (
                            <>
                              <p className="text-green-600 font-bold text-lg">
                                ¡NÚMERO GANADOR: {sorteo.numero_ganador}!
                              </p>
                              {sorteo.ganador ? (
                                <p className="text-blue-600 font-semibold">
                                  Ganador: {sorteo.ganador.full_name} ({sorteo.ganador.email})
                                </p>
                              ) : (
                                <p className="text-red-600 font-semibold">
                                  Este número no fue seleccionado por nadie. No hay ganador.
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-red-600 font-semibold">
                              Sorteo finalizado sin ganador.
                            </p>
                          )}
                        </div>
                        <p className="font-semibold text-red-600">Estado: {sorteo.estado}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showBilletesModal}
        onClose={() => setShowBilletesModal(false)}
        title={`Billetes de ${selectedSorteo?.titulo}`}
        size="xl"
      >
        <div className="space-y-4">
          {loadingBilletes ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Cargando billetes...</span>
            </div>
          ) : (
            <>
              <p className="text-gray-600">
                Billetes disponibles: {billetes.filter(b => b.estado === 'disponible').length} / 100
              </p>
              
              <div className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto">
                {billetes.map((billete) => (
                  <button
                    key={billete.id}
                    onClick={() => {
                      if (billete.estado === 'disponible') {
                        tomarBillete(selectedSorteo!.id, billete.numero);
                      }
                    }}
                    className={`p-2 text-sm font-medium rounded ${
                      billete.estado === 'disponible'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                        : 'bg-red-100 text-red-800 cursor-not-allowed'
                    }`}
                    disabled={billete.estado !== 'disponible'}
                  >
                    {billete.numero}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowBilletesModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Sorteo"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Sorteo</label>
            <select
              value={tipoSorteo}
              onChange={(e) => setTipoSorteo(e.target.value as 'loteria' | 'rifa')}
              className="w-full p-2 border rounded"
            >
              <option value="loteria">Lotería</option>
              <option value="rifa">Rifa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Natillera</label>
            <select
              value={selectedNatillera || ''}
              onChange={(e) => setSelectedNatillera(Number(e.target.value))}
              className="w-full p-2 border rounded"
            >
              <option value="">Seleccionar natillera</option>
              {userNatilleras.map((natillera) => (
                <option key={natillera.id} value={natillera.id}>
                  {natillera.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Título del sorteo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Descripción opcional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha de Sorteo (opcional)</label>
            <input
              type="date"
              value={fechaSorteo}
              onChange={(e) => setFechaSorteo(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateSorteo}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Crear
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        title={`Administrar Billetes - ${selectedSorteo?.titulo}`}
        size="xl"
      >
        <div className="space-y-4">
          {loadingAdmin ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Cargando billetes...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminBilletes.map((billete) => (
                  <div key={billete.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-bold">#{billete.numero}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        billete.estado === 'tomado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {billete.estado}
                      </span>
                    </div>
                    
                    {billete.estado === 'tomado' && billete.tomado_por && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          Tomado por: {(() => {
                            const usuario = users.find(u => u.id === billete.tomado_por);
                            return usuario ? `${usuario.full_name} (${usuario.email})` : `Usuario ID: ${billete.tomado_por}`;
                          })()}
                        </p>
                        {billete.fecha_tomado && (
                          <p className="text-xs text-gray-500">
                            Fecha: {new Date(billete.fecha_tomado).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {billete.estado === 'tomado' && (
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${billete.pagado ? 'text-green-600' : 'text-red-600'}`}>
                          {billete.pagado ? '✓ Pagado' : '✗ Pendiente'}
                        </span>
                        {!billete.pagado && (
                          <button
                            onClick={() => marcarBilletePagado(selectedSorteo!.id, billete.numero)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Marcar Pagado
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Resumen</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total billetes:</span> {adminBilletes.length}
                  </div>
                  <div>
                    <span className="font-medium">Tomados:</span> {adminBilletes.filter(b => b.estado === 'tomado').length}
                  </div>
                  <div>
                    <span className="font-medium">Pagados:</span> {adminBilletes.filter(b => b.pagado).length}
                  </div>
                  <div>
                    <span className="font-medium">Pendientes:</span> {adminBilletes.filter(b => b.estado === 'tomado' && !b.pagado).length}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showFinalizarModal}
        onClose={() => setShowFinalizarModal(false)}
        title={`Finalizar Sorteo: ${selectedSorteo?.titulo}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que quieres finalizar este sorteo? Esta acción no se puede deshacer.
          </p>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Número ganador (opcional - deja vacío para selección aleatoria)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={numeroGanadorManual}
              onChange={(e) => setNumeroGanadorManual(e.target.value)}
              placeholder="Ingresa el número ganador (1-100)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {numeroGanadorManual && (
              <p className="text-sm text-gray-500 mt-1">
                Se verificará que el número {numeroGanadorManual} esté tomado por alguien. Si no lo está, no habrá ganador.
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowFinalizarModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarFinalizarSorteo}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              {numeroGanadorManual ? `Finalizar con #${numeroGanadorManual}` : 'Finalizar Aleatoriamente'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
