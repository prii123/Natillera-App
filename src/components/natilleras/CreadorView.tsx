// Utilidad local para formatear moneda COP
function formatCurrency(value: number) {
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}
import React from 'react';


export default function CreadorView({ natillera, balance, loadingBalance, loadingMembers, SkeletonBox }: any) {
  return (
    <>
      {/* Gestión de Miembros */}
      <div className="mb-8">
        <div className="text-xl font-bold mb-4 text-blue-900">Gestión de Miembros</div>
        {loadingMembers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border bg-blue-50 border-blue-300 shadow-sm flex flex-col gap-2">
                <SkeletonBox className="h-6 w-32 mb-2" />
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-3 w-20" />
                <SkeletonBox className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(natillera.members || []).map((member: any) => (
              <div key={Number(member.id)} className="p-4 rounded-xl border bg-blue-50 border-blue-300 shadow-sm flex flex-col gap-1">
                <div className="font-semibold text-blue-900 text-lg">{member.full_name}</div>
                <div className="text-sm text-blue-700">@{member.username}</div>
                <div className="text-xs text-blue-700">{member.email}</div>
                {Number(member.id) === Number(natillera.creator_id) && (
                  <span className="inline-block mt-2 text-xs font-bold border px-2 py-1 rounded-full bg-blue-600 text-white border-blue-800 tracking-wide">👑 Creador</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aprobación de Aportes Pendientes */}
      <div className="mb-8">
        <div className="text-xl font-bold mb-4 text-blue-900">Aprobación de Aportes Pendientes</div>
        {(!natillera.aportesPendientes || natillera.aportesPendientes.length === 0) ? (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700">No hay aportes pendientes por aprobar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {natillera.aportesPendientes.map((aporte: any) => (
                  <tr key={aporte.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{aporte.user?.full_name || 'Usuario'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(Number(aporte.amount))}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{new Date(aporte.created_at).toLocaleDateString('es-CO')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => natillera.onApproveAporte(aporte.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                      >✓ Aprobar</button>
                      <button
                        onClick={() => natillera.onRejectAporte(aporte.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                      >✗ Rechazar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Participación de Miembros */}
      <div className="mb-8">
        <div className="text-xl font-bold mb-4 text-blue-900">Participación de Miembros</div>
        {(!natillera.aportesTotales || natillera.aportesTotales.length === 0) ? (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700">No hay aportes registrados aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miembro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Aportado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">% del Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {natillera.aportesTotales.map((item: any) => (
                  <tr key={item.user.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{item.user.full_name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{item.totalAportado.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{item.porcentaje.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estado Financiero de la Natillera */}
      <div className="mb-8">
        <div className="text-xl font-bold mb-4 text-blue-900">Estado Financiero</div>
        {loadingBalance ? (
          <div className="flex gap-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonBox key={i} className="h-12 w-32" />
            ))}
          </div>
        ) : balance ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border bg-green-50 border-green-300 shadow-sm flex flex-col items-center">
              <span className="text-2xl mb-1">💵</span>
              <span className="font-semibold text-green-900">Efectivo</span>
              <span className="text-lg font-bold text-green-800">{formatCurrency(Number(balance.efectivo))}</span>
            </div>
            <div className="p-4 rounded-xl border bg-yellow-50 border-yellow-300 shadow-sm flex flex-col items-center">
              <span className="text-2xl mb-1">💸</span>
              <span className="font-semibold text-yellow-900">Préstamos</span>
              <span className="text-lg font-bold text-yellow-800">{formatCurrency(Number(balance.prestamos))}</span>
            </div>
            <div className="p-4 rounded-xl border bg-blue-50 border-blue-300 shadow-sm flex flex-col items-center">
              <span className="text-2xl mb-1">📈</span>
              <span className="font-semibold text-blue-900">Ingresos</span>
              <span className="text-lg font-bold text-blue-800">{formatCurrency(Number(balance.ingresos))}</span>
            </div>
            <div className="p-4 rounded-xl border bg-red-50 border-red-300 shadow-sm flex flex-col items-center">
              <span className="text-2xl mb-1">📉</span>
              <span className="font-semibold text-red-900">Gastos</span>
              <span className="text-lg font-bold text-red-800">{formatCurrency(Number(balance.gastos))}</span>
            </div>
            <div className="p-4 rounded-xl border bg-purple-50 border-purple-300 shadow-sm flex flex-col items-center">
              <span className="text-2xl mb-1">🏦</span>
              <span className="font-semibold text-purple-900">Capital Disponible</span>
              <span className="text-lg font-bold text-purple-800">{formatCurrency(Number(balance.capital_disponible))}</span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700">No hay datos financieros disponibles.</div>
        )}
      </div>
    </>
  );
}
