import React from "react";

interface Props {
  natillera: any;
  user: any;
}


import { useEffect, useState } from "react";
import { fetchAPI, formatCurrency } from "@/lib/api";

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
  monto_pendiente?: number;
  interes_total?: number;
  monto_total?: number;
}

interface Pago {
  id: number;
  monto: number;
  fecha_pago: string;
  estado: string;
}

const PrestamosMiembro: React.FC<Props> = ({ natillera, user }) => {
  const [prestamosAprobados, setPrestamosAprobados] = useState<Prestamo[]>([]);
  const [prestamosRechazados, setPrestamosRechazados] = useState<Prestamo[]>([]);
  const [prestamosPendientes, setPrestamosPendientes] = useState<Prestamo[]>([]);
  const [pagos, setPagos] = useState<{ [prestamoId: number]: Pago[] }>({});
  const [prestamosDetalles, setPrestamosDetalles] = useState<{ [prestamoId: number]: any }>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [montoSolicitado, setMontoSolicitado] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !natillera) return;
    const cargarPrestamos = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI(`/prestamos/natilleras/${natillera.id}?referente_id=${user.id}&estado=activo`);
        if (res.ok) {
          const data = await res.json();
          setPrestamosAprobados(data.aprobados || []);
          setPrestamosRechazados(data.rechazados || []);
          setPrestamosPendientes(data.pendientes || []);
          // Cargar pagos y detalles para cada préstamo
          const allPrestamos = [...(data.aprobados || []), ...(data.rechazados || []), ...(data.pendientes || [])];
          for (const p of allPrestamos) {
            const pagosRes = await fetchAPI(`/prestamos/${p.id}/pagos`);
            if (pagosRes.ok) {
              const pagosData = await pagosRes.json();
              setPagos(prev => ({ ...prev, [p.id]: pagosData.pagos }));
              setPrestamosDetalles(prev => ({ ...prev, [p.id]: pagosData.prestamo }));
            }
          }
        }
      } catch (e) {
        setError("Error al cargar préstamos");
      }
      setLoading(false);
    };
    cargarPrestamos();
  }, [user, natillera]);

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrestamo) {
      setError("Selecciona un préstamo");
      return;
    }
    const monto = parseFloat(paymentAmount);
    if (isNaN(monto) || monto <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    setPaymentSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetchAPI(`/prestamos/${selectedPrestamo.id}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto_pago: monto }),
      });
      if (res.ok) {
        setSuccess("Pago realizado correctamente");
        setPaymentAmount("");
        setSelectedPrestamo(null);
        // Recargar pagos
        const pagosRes = await fetchAPI(`/prestamos/${selectedPrestamo.id}/pagos`);
        if (pagosRes.ok) {
          const pagosData = await pagosRes.json();
          setPagos(prev => ({ ...prev, [selectedPrestamo.id]: pagosData.pagos }));
          setPrestamosDetalles(prev => ({ ...prev, [selectedPrestamo.id]: pagosData.prestamo }));
        }
      } else {
        const err = await res.json();
        let errorMsg = "Error al realizar pago";
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
      setError("Error al realizar pago");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleSolicitarPrestamo = async (e: React.FormEvent) => {
    setError("");
    setSuccess("");
    const monto = parseFloat(montoSolicitado);
    if (isNaN(monto) || monto <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    if (!fechaInicio || !fechaVencimiento) {
      setError("Ingresa las fechas");
      return;
    }
    setSubmitting(true);
    const payload = {
      natillera_id: natillera.id,
      monto,
      plazo_meses: 1,
      tasa_interes: 12,
      fecha_inicio: fechaInicio ? new Date(fechaInicio).toISOString() : undefined,
      fecha_vencimiento: fechaVencimiento ? new Date(fechaVencimiento).toISOString() : undefined,
      referente_id: user.id,
      nombre_prestatario: user.full_name,
      telefono_prestatario: "",
      email_prestatario: user.email,
      direccion_prestatario: "",
    };
    try {
      const res = await fetchAPI("/prestamos/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess("Solicitud enviada correctamente");
        setMontoSolicitado("");
        setFechaInicio("");
        setFechaVencimiento("");
        setShowForm(false);
      } else {
        const err = await res.json();
        let errorMsg = "Error al solicitar préstamo";
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
      setError("Error al solicitar préstamo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Préstamos Miembro</h1>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <p className="mb-2">Bienvenido, <span className="font-semibold">{user?.full_name}</span></p>
        <p className="mb-2">Natillera: <span className="font-semibold">{natillera?.name}</span></p>
      </div>

      {/* Sección de solicitar préstamo y pagos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sección de solicitar préstamo */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">Solicitar nuevo préstamo</h2>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}
          <form onSubmit={handleSolicitarPrestamo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monto solicitado</label>
              <input
                type="number"
                value={montoSolicitado}
                onChange={e => setMontoSolicitado(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha vencimiento</label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={e => setFechaVencimiento(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium" disabled={submitting}>
              {submitting ? "Enviando solicitud..." : "Solicitar Préstamo"}
            </button>
          </form>
        </div>

        {/* Sección de pagos de préstamos */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">Hacer pago a préstamo</h2>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}
          <form onSubmit={handleMakePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Seleccionar préstamo aprobado</label>
              <select
                value={selectedPrestamo?.id || ""}
                onChange={e => {
                  const id = parseInt(e.target.value);
                  const prestamo = prestamosAprobados.find(p => p.id === id) || null;
                  setSelectedPrestamo(prestamo);
                }}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Selecciona un préstamo</option>
                {prestamosAprobados.map(prestamo => (
                  <option key={prestamo.id} value={prestamo.id}>
                    {prestamo.nombre_prestatario} - {formatCurrency(prestamo.monto)} (Pagado: {formatCurrency(prestamo.monto_pagado)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monto del pago</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                step="0.01"
                required
              />
            </div>
            <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium" disabled={paymentSubmitting}>
              {paymentSubmitting ? "Procesando pago..." : "Realizar Pago"}
            </button>
          </form>
        </div>
      </div>

      {/* Préstamos aprobados */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Préstamos aprobados</h2>
        {loading ? (
          <div className="text-gray-500">Cargando préstamos...</div>
        ) : prestamosAprobados.length === 0 ? (
          <div className="text-gray-500">No tienes préstamos aprobados.</div>
        ) : (
          prestamosAprobados.map(prestamo => {
            const detalle = prestamosDetalles[prestamo.id] || prestamo;
            return (
              <div key={prestamo.id} className="border-b py-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold">{detalle.nombre_prestatario}</span>
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-green-100 text-green-800">Aprobado</span>
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">{detalle.estado}</span>
                  </div>
                  <div className="text-sm">Monto: <span className="font-bold">{formatCurrency(detalle.monto)}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>Pagado: <span className="text-green-700">{formatCurrency(detalle.monto_pagado)}</span></div>
                  <div>Saldo adeudado: <span className="text-red-700 font-semibold">{formatCurrency(detalle.monto_pendiente || (() => {
                    const monto = Number(detalle.monto) || 0;
                    const tasa = Number(detalle.tasa_interes) || 0;
                    const plazo = Number(detalle.plazo_meses) || 0;
                    const pagado = Number(detalle.monto_pagado) || 0;
                    
                    if (monto <= 0 || tasa <= 0 || plazo <= 0) return 0;
                    
                    const interes_total = (monto * tasa / 100) * (plazo / 12);
                    const monto_total = monto + interes_total;
                    return Math.max(0, monto_total - pagado);
                  })())}</span></div>
                  <div>Tasa: {detalle.tasa_interes}%</div>
 
                  <div>Plazo: {detalle.plazo_meses} meses</div>
                  <div>Vence: {detalle.fecha_vencimiento ? new Date(detalle.fecha_vencimiento).toLocaleDateString() : ''}</div>
                </div>
                {/* Historial de pagos */}
                <div className="mt-2">
                  <h3 className="font-semibold mb-1">Historial de pagos</h3>
                  {pagos[prestamo.id] && pagos[prestamo.id].length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {pagos[prestamo.id].map(pago => (
                        <li key={pago.id} className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span>{new Date(pago.fecha_pago).toLocaleDateString()}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              pago.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                              pago.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {pago.estado === 'APROBADO' ? 'Aprobado' :
                               pago.estado === 'PENDIENTE' ? 'Pendiente' :
                               pago.estado}
                            </span>
                          </div>
                          <span className="text-green-700 font-medium">{formatCurrency(pago.monto)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400">Sin pagos registrados.</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Préstamos pendientes */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Préstamos pendientes por aprobar</h2>
        {loading ? (
          <div className="text-gray-500">Cargando préstamos...</div>
        ) : prestamosPendientes.length === 0 ? (
          <div className="text-gray-500">No tienes préstamos pendientes por aprobar.</div>
        ) : (
          prestamosPendientes.map(prestamo => {
            const detalle = prestamosDetalles[prestamo.id] || prestamo;
            return (
              <div key={prestamo.id} className="border-b py-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold">{detalle.nombre_prestatario}</span>
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">Pendiente por aprobar</span>
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">{detalle.estado}</span>
                  </div>
                  <div className="text-sm">Monto: <span className="font-bold">{formatCurrency(detalle.monto)}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>Pagado: <span className="text-green-700">{formatCurrency(detalle.monto_pagado)}</span></div>
                  <div>Tasa: {detalle.tasa_interes}%</div>
                  <div>Plazo: {detalle.plazo_meses} meses</div>
                  <div>Vence: {detalle.fecha_vencimiento ? new Date(detalle.fecha_vencimiento).toLocaleDateString() : ''}</div>
                </div>
                {/* Historial de pagos */}
                <div className="mt-2">
                  <h3 className="font-semibold mb-1">Historial de pagos</h3>
                  {pagos[prestamo.id] && pagos[prestamo.id].length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {pagos[prestamo.id].map(pago => (
                        <li key={pago.id} className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span>{new Date(pago.fecha_pago).toLocaleDateString()}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              pago.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                              pago.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {pago.estado === 'APROBADO' ? 'Aprobado' :
                               pago.estado === 'PENDIENTE' ? 'Pendiente' :
                               pago.estado}
                            </span>
                          </div>
                          <span className="text-green-700 font-medium">{formatCurrency(pago.monto)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400">Sin pagos registrados.</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Préstamos rechazados */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-4">Préstamos rechazados</h2>
        {loading ? (
          <div className="text-gray-500">Cargando préstamos...</div>
        ) : prestamosRechazados.length === 0 ? (
          <div className="text-gray-500">No tienes préstamos rechazados.</div>
        ) : (
          prestamosRechazados.map(prestamo => {
            const detalle = prestamosDetalles[prestamo.id] || prestamo;
            return (
              <div key={prestamo.id} className="border-b py-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold">{detalle.nombre_prestatario}</span>
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-red-100 text-red-800">Rechazado</span>
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">{detalle.estado}</span>
                  </div>
                  <div className="text-sm">Monto: <span className="font-bold">{formatCurrency(detalle.monto)}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>Pagado: <span className="text-green-700">{formatCurrency(detalle.monto_pagado)}</span></div>
                  <div>Tasa: {detalle.tasa_interes}%</div>
                  <div>Plazo: {detalle.plazo_meses} meses</div>
                  <div>Vence: {detalle.fecha_vencimiento ? new Date(detalle.fecha_vencimiento).toLocaleDateString() : ''}</div>
                </div>
                {/* Historial de pagos */}
                <div className="mt-2">
                  <h3 className="font-semibold mb-1">Historial de pagos</h3>
                  {pagos[prestamo.id] && pagos[prestamo.id].length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {pagos[prestamo.id].map(pago => (
                        <li key={pago.id} className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span>{new Date(pago.fecha_pago).toLocaleDateString()}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              pago.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                              pago.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {pago.estado === 'APROBADO' ? 'Aprobado' :
                               pago.estado === 'PENDIENTE' ? 'Pendiente' :
                               pago.estado}
                            </span>
                          </div>
                          <span className="text-green-700 font-medium">{formatCurrency(pago.monto)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400">Sin pagos registrados.</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PrestamosMiembro;
