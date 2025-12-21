// Utilidad local para formatear moneda COP
function formatCurrency(value: number) {
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}
import React from 'react';

export default function MiembroView({ natillera, estadisticas, loadingEstadisticas, balance, loadingBalance, SkeletonBox }: any) {
  // Usar estadisticas para mostrar total ahorrado y porcentaje
  let totalAhorro = 0;
  let porcentaje = 0;
  if (estadisticas) {
    totalAhorro = estadisticas.total_ahorrado || 0;
    const totalGlobal = estadisticas.total_global_ahorrado || 0;
    porcentaje = totalGlobal > 0 ? Math.round((totalAhorro / totalGlobal) * 10000) / 100 : 0;
  }

  return (
    <>
      {/* Resumen de Ahorro */}
      <div className="mb-8">
        <div className="text-xl font-bold mb-4 text-blue-900">Resumen de Ahorro</div>
        {loadingEstadisticas ? (
          <SkeletonBox className="h-16 w-48" />
        ) : (
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-green-900 flex flex-col items-center">
            <span className="text-2xl mb-2">💰</span>
            <span className="text-lg font-semibold">Total Ahorrado</span>
            <span className="text-3xl font-bold mt-1">{formatCurrency(totalAhorro)}</span>
            <span className="text-sm mt-2">Participación: <span className="font-semibold">{porcentaje}%</span></span>
          </div>
        )}
      </div>


      {/* Estado Financiero Simple (Placeholder) */}
      <div className="mb-8">
        <div className="text-xl font-bold mb-4 text-blue-900">Estado Financiero de la Natillera</div>
        {loadingBalance ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border shadow-sm bg-gray-100 border-gray-200 flex flex-col gap-2">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-8 w-20" />
                <SkeletonBox className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : balance && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border bg-blue-50 border-blue-400">
              <div className="text-sm mb-1 text-blue-800 font-semibold">💵 Efectivo Total</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(Number(balance.efectivo))}</div>
              <div className="text-xs mt-1 text-blue-800">Aportes aprobados</div>
            </div>
            <div className="p-4 rounded-xl border bg-yellow-50 border-yellow-400">
              <div className="text-sm mb-1 text-yellow-800 font-semibold">💰 Préstamos</div>
              <div className="text-2xl font-bold text-yellow-900">{formatCurrency(Number(balance.prestamos))}</div>
              <div className="text-xs mt-1 text-yellow-800">Dinero prestado</div>
            </div>
            <div className="p-4 rounded-xl border bg-green-50 border-green-400">
              <div className="text-sm mb-1 text-green-800 font-semibold">📈 Ingresos</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(Number(balance.ingresos))}</div>
              <div className="text-xs mt-1 text-green-800">Intereses y otros</div>
            </div>
            <div className="p-4 rounded-xl border bg-red-50 border-red-400">
              <div className="text-sm mb-1 text-red-800 font-semibold">📉 Gastos</div>
              <div className="text-2xl font-bold text-red-900">{formatCurrency(Number(balance.gastos))}</div>
              <div className="text-xs mt-1 text-red-800">Costos operativos</div>
            </div>
            <div className="p-4 rounded-xl border bg-violet-50 border-violet-400">
              <div className="text-sm mb-1 text-violet-800 font-semibold">🏦 Capital Disponible</div>
              <div className="text-2xl font-bold text-violet-900">{formatCurrency(Number(balance.capital_disponible))}</div>
              <div className="text-xs mt-1 text-violet-800">Capital neto</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
