import React from "react";
import { useEffect, useState } from "react";
import { fetchAPI, formatCurrency } from "@/lib/api";
import { useInvalidateNotifications } from "@/hooks/useNotifications";
import FileViewerModal from "@/components/FileViewerModal";

interface Props {
  natillera: any;
  user: any;
}

interface ArchivoAdjunto {
  id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano: number;
  fecha_subida: string;
}

interface Prestamo {
  id: number;
  nombre_prestatario: string;
  monto: number;
  monto_pagado: number;
  tasa_interes: number;
  plazo_meses: number;
  estado: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  aprobado: boolean | null;
}

interface PagoPendiente {
  id: number;
  prestamo_id: number;
  monto: number;
  fecha_pago: string;
  prestatario: string;
  prestamo_monto: number;
  archivos_adjuntos?: ArchivoAdjunto[];
}

const PrestamosCreador: React.FC<Props> = ({ natillera, user }) => {
  const [prestamosPendientes, setPrestamosPendientes] = useState<Prestamo[]>([]);
  const [prestamosAprobados, setPrestamosAprobados] = useState<Prestamo[]>([]);
  const [prestamosRechazados, setPrestamosRechazados] = useState<Prestamo[]>([]);
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingPrestamo, setEditingPrestamo] = useState<Prestamo | null>(null);
  const [editMonto, setEditMonto] = useState("");
  const [editTasa, setEditTasa] = useState("");
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedPagoFiles, setSelectedPagoFiles] = useState<ArchivoAdjunto[]>([]);

  const invalidateNotifications = useInvalidateNotifications();

  useEffect(() => {
    if (!user || !natillera) return;
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [prestamosRes, pagosRes] = await Promise.all([
          fetchAPI(`/prestamos/natilleras/${natillera.id}?estado=activo`),
          fetchAPI('/prestamos/pagos/pendientes')
        ]);
        
        if (prestamosRes.ok) {
          const data = await prestamosRes.json();
          setPrestamosPendientes(data.pendientes || []);
          setPrestamosAprobados(data.aprobados || []);
          setPrestamosRechazados(data.rechazados || []);
        }
        
        if (pagosRes.ok) {
          const pagosData = await pagosRes.json();
          // Cargar archivos adjuntos para cada pago pendiente
          const pagosConArchivos = await Promise.all(
            pagosData.map(async (pago: PagoPendiente) => {
              try {
                const archivosRes = await fetchAPI(`/archivos_adjuntos/pago_prestamo/${pago.id}`);
                if (archivosRes.ok) {
                  const archivos = await archivosRes.json();
                  return { ...pago, archivos_adjuntos: archivos };
                }
                return pago;
              } catch (error) {
                return pago;
              }
            })
          );
          setPagosPendientes(pagosConArchivos);
        }
      } catch (e) {
        setError("Error al cargar datos");
      }
      setLoading(false);
    };
    cargarDatos();
  }, [user, natillera]);

  const handleAprobar = async (prestamoId: number) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetchAPI(`/prestamos/${prestamoId}/aprobar`, {
        method: "PATCH",
      });
      if (res.ok) {
        setSuccess("Préstamo aprobado correctamente");
        // Mover de pendientes a aprobados
        const aprobado = prestamosPendientes.find(p => p.id === prestamoId);
        if (aprobado) {
          aprobado.aprobado = true;
          setPrestamosPendientes(prev => prev.filter(p => p.id !== prestamoId));
          setPrestamosAprobados(prev => [...prev, aprobado]);
        }
        // Invalidar notificaciones para actualizar el contador
        invalidateNotifications();
      } else {
        const err = await res.json();
        let errorMsg = "Error al aprobar préstamo";
        if (err.detail) {
          if (typeof err.detail === 'string') {
            errorMsg = err.detail;
          } else if (Array.isArray(err.detail)) {
            errorMsg = err.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
          } else {
            errorMsg = JSON.stringify(err.detail);
          }
        }
        setError(errorMsg);
      }
    } catch (e) {
      setError("Error al aprobar préstamo");
    }
  };

  const handleRechazar = async (prestamoId: number) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetchAPI(`/prestamos/${prestamoId}/rechazar`, {
        method: "PATCH",
      });
      if (res.ok) {
        setSuccess("Préstamo rechazado correctamente");
        // Mover de pendientes a rechazados
        const rechazado = prestamosPendientes.find(p => p.id === prestamoId);
        if (rechazado) {
          rechazado.aprobado = false;
          setPrestamosPendientes(prev => prev.filter(p => p.id !== prestamoId));
          setPrestamosRechazados(prev => [...prev, rechazado]);
        }
      } else {
        const err = await res.json();
        let errorMsg = "Error al rechazar préstamo";
        if (err.detail) {
          if (typeof err.detail === 'string') {
            errorMsg = err.detail;
          } else if (Array.isArray(err.detail)) {
            errorMsg = err.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
          } else {
            errorMsg = JSON.stringify(err.detail);
          }
        }
        setError(errorMsg);
      }
    } catch (e) {
      setError("Error al rechazar préstamo");
    }
  };

  const handleEditar = (prestamo: Prestamo) => {
    setEditingPrestamo(prestamo);
    setEditMonto(prestamo.monto.toString());
    setEditTasa(prestamo.tasa_interes.toString());
  };

  const handleGuardarEdicion = async () => {
    if (!editingPrestamo) return;
    setError("");
    setSuccess("");
    const nuevoMonto = parseFloat(editMonto);
    const nuevaTasa = parseFloat(editTasa);
    if (isNaN(nuevoMonto) || nuevoMonto <= 0 || isNaN(nuevaTasa) || nuevaTasa <= 0) {
      setError("Ingresa valores válidos");
      return;
    }
    try {
      const res = await fetchAPI(`/prestamos/${editingPrestamo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: nuevoMonto,
          tasa_interes: nuevaTasa,
        }),
      });
      if (res.ok) {
        setSuccess("Préstamo actualizado correctamente");
        // Actualizar en la lista
        setPrestamosPendientes(prev =>
          prev.map(p =>
            p.id === editingPrestamo.id
              ? { ...p, monto: nuevoMonto, tasa_interes: nuevaTasa }
              : p
          )
        );
        setEditingPrestamo(null);
      } else {
        const err = await res.json();
        let errorMsg = "Error al actualizar préstamo";
        if (err.detail) {
          if (typeof err.detail === 'string') {
            errorMsg = err.detail;
          } else if (Array.isArray(err.detail)) {
            errorMsg = err.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
          } else {
            errorMsg = JSON.stringify(err.detail);
          }
        }
        setError(errorMsg);
      }
    } catch (e) {
      setError("Error al actualizar préstamo");
    }
  };

  const handleCancelarEdicion = () => {
    setEditingPrestamo(null);
  };

  const handleAprobarPago = async (pagoId: number) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetchAPI(`/prestamos/pagos/${pagoId}/aprobar`, {
        method: "PATCH",
      });
      if (res.ok) {
        setSuccess("Pago aprobado correctamente");
        // Remover el pago de la lista de pendientes
        setPagosPendientes(prev => prev.filter(p => p.id !== pagoId));
        // Recargar préstamos para actualizar montos
        const prestamosRes = await fetchAPI(`/prestamos/natilleras/${natillera.id}?estado=activo`);
        if (prestamosRes.ok) {
          const data = await prestamosRes.json();
          setPrestamosAprobados(data.aprobados || []);
        }
        // Invalidar notificaciones para actualizar el contador
        invalidateNotifications();
      } else {
        const err = await res.json();
        let errorMsg = "Error al aprobar pago";
        if (err.detail) {
          if (typeof err.detail === 'string') {
            errorMsg = err.detail;
          } else if (Array.isArray(err.detail)) {
            errorMsg = err.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
          } else {
            errorMsg = JSON.stringify(err.detail);
          }
        }
        setError(errorMsg);
      }
    } catch (e) {
      setError("Error al aprobar pago");
    }
  };

  const handleViewPagoFiles = (pago: PagoPendiente) => {
    setSelectedPagoFiles(pago.archivos_adjuntos || []);
    setShowFileModal(true);
  };

  const handleDeletePagoFile = async (fileId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) return;
    
    try {
      const res = await fetchAPI(`/archivos_adjuntos/${fileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Actualizar la lista de archivos del pago seleccionado
        setSelectedPagoFiles(prev => prev.filter(f => f.id !== fileId));
        // También actualizar en la lista de pagos pendientes
        setPagosPendientes(prev => prev.map(p => ({
          ...p,
          archivos_adjuntos: p.archivos_adjuntos?.filter(f => f.id !== fileId) || []
        })));
        setSuccess('Archivo eliminado correctamente');
      } else {
        setError('Error al eliminar archivo');
      }
    } catch (e) {
      setError('Error al eliminar archivo');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <p className="mb-2">Bienvenido, <span className="font-semibold">{user?.full_name}</span></p>
        <p className="mb-2">Natillera: <span className="font-semibold">{natillera?.name}</span></p>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}

      {/* Préstamos pendientes por aprobar */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Préstamos pendientes por aprobar</h2>
        {loading ? (
          <div className="text-gray-500">Cargando préstamos...</div>
        ) : prestamosPendientes.length === 0 ? (
          <div className="text-gray-500">No hay préstamos pendientes.</div>
        ) : (
          prestamosPendientes.map(prestamo => (
            <div key={prestamo.id} className="border-b py-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold">{prestamo.nombre_prestatario}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">Pendiente por aprobar</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">{prestamo.estado}</span>
                </div>
                <div className="text-sm">Monto: <span className="font-bold">{formatCurrency(prestamo.monto)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div>Tasa: {prestamo.tasa_interes}%</div>
                <div>Plazo: {prestamo.plazo_meses} meses</div>
                <div>Vence: {prestamo.fecha_vencimiento ? new Date(prestamo.fecha_vencimiento).toLocaleDateString() : ''}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditar(prestamo)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleAprobar(prestamo.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => handleRechazar(prestamo.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagos pendientes por aprobar */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Pagos pendientes por aprobar</h2>
        {loading ? (
          <div className="text-gray-500">Cargando pagos...</div>
        ) : pagosPendientes.length === 0 ? (
          <div className="text-gray-500">No hay pagos pendientes.</div>
        ) : (
          pagosPendientes.map(pago => (
            <div key={pago.id} className="border-b py-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold">{pago.prestatario}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">Pago pendiente</span>
                </div>
                <div className="text-sm">Monto: <span className="font-bold">{formatCurrency(pago.monto)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div>Préstamo: {formatCurrency(pago.prestamo_monto)}</div>
                <div>Fecha: {new Date(pago.fecha_pago).toLocaleDateString()}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAprobarPago(pago.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Aprobar Pago
                </button>
                {pago.archivos_adjuntos && pago.archivos_adjuntos.length > 0 && (
                  <button
                    onClick={() => handleViewPagoFiles(pago)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Ver Archivos ({pago.archivos_adjuntos.length})
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Préstamos aprobados */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Préstamos aprobados</h2>
        {prestamosAprobados.length === 0 ? (
          <div className="text-gray-500">No hay préstamos aprobados.</div>
        ) : (
          prestamosAprobados.map(prestamo => {
            const totalAPagar = Number(prestamo.monto) + (Number(prestamo.monto) * Number(prestamo.tasa_interes) / 100) * (Number(prestamo.plazo_meses) / 12);
            const saldoPendiente = Number(totalAPagar) - Number(prestamo.monto_pagado);
            return (
            <div key={prestamo.id} className="border-b py-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold">{prestamo.nombre_prestatario}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-green-100 text-green-800">Aprobado</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">{prestamo.estado}</span>
                </div>
                <div className="text-sm">Monto: <span className="font-bold">{formatCurrency(prestamo.monto)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div>Pagado: <span className="text-green-700">{formatCurrency(prestamo.monto_pagado)}</span></div>
                <div>Tasa: {prestamo.tasa_interes}%</div>
                <div>Plazo: {prestamo.plazo_meses} meses</div>
                <div>Vence: {prestamo.fecha_vencimiento ? new Date(prestamo.fecha_vencimiento).toLocaleDateString() : ''}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total a pagar: <span className="font-bold">{formatCurrency(totalAPagar)}</span></div>
                <div>Saldo pendiente: <span className="font-bold text-red-600">{formatCurrency(Math.max(0, saldoPendiente))}</span></div>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Préstamos rechazados */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-4">Préstamos rechazados</h2>
        {prestamosRechazados.length === 0 ? (
          <div className="text-gray-500">No hay préstamos rechazados.</div>
        ) : (
          prestamosRechazados.map(prestamo => (
            <div key={prestamo.id} className="border-b py-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold">{prestamo.nombre_prestatario}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-red-100 text-red-800">Rechazado</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">{prestamo.estado}</span>
                </div>
                <div className="text-sm">Monto: <span className="font-bold">{formatCurrency(prestamo.monto)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div>Tasa: {prestamo.tasa_interes}%</div>
                <div>Plazo: {prestamo.plazo_meses} meses</div>
                <div>Vence: {prestamo.fecha_vencimiento ? new Date(prestamo.fecha_vencimiento).toLocaleDateString() : ''}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de edición */}
      {editingPrestamo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Editar Préstamo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monto</label>
                <input
                  type="number"
                  value={editMonto}
                  onChange={e => setEditMonto(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tasa de Interés (%)</label>
                <input
                  type="number"
                  value={editTasa}
                  onChange={e => setEditTasa(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleGuardarEdicion}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Guardar
              </button>
              <button
                onClick={handleCancelarEdicion}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showFileModal && (
        <FileViewerModal
          isOpen={showFileModal}
          onClose={() => setShowFileModal(false)}
          archivos={selectedPagoFiles}
          onDeleteFile={handleDeletePagoFile}
          canDelete={true}
        />
      )}
    </div>
  );
};

export default PrestamosCreador;
