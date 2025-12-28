// Utilidad local para formatear moneda COP
function formatCurrency(value: number) {
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}
import React, { useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { toast } from 'sonner';


export default function CreadorView({ natillera, balance, loadingBalance, loadingMembers, SkeletonBox }: any) {
  const [invitationEmail, setInvitationEmail] = useState('');
  const [sendingInvitation, setSendingInvitation] = useState(false);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationEmail.trim()) {
      toast.error('Ingresa un email válido');
      return;
    }
    setSendingInvitation(true);
    try {
      const response = await fetchAPI('/invitaciones/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          natillera_id: natillera.id,
          invited_email: invitationEmail.trim()
        })
      });
      if (response.ok) {
        toast.success('Invitación enviada exitosamente');
        setInvitationEmail('');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al enviar invitación');
      }
    } catch (error) {
      toast.error('Error al enviar invitación');
    }
    setSendingInvitation(false);
  };
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

      {/* Enviar Invitaciones */}
      <div className="mb-8">
        <div className="text-xl font-bold mb-4 text-blue-900">Enviar Invitaciones</div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-300">
          <p className="text-sm text-gray-600 mb-4">Invita a nuevos miembros a unirse a tu natillera enviándoles una invitación por email.</p>
          <form onSubmit={handleSendInvitation} className="flex gap-4">
            <input
              type="email"
              value={invitationEmail}
              onChange={(e) => setInvitationEmail(e.target.value)}
              placeholder="Email del usuario a invitar"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={sendingInvitation}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {sendingInvitation ? 'Enviando...' : 'Enviar Invitación'}
            </button>
          </form>
        </div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adjuntos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {natillera.aportesPendientes.map((aporte: any) => (
                  <tr key={aporte.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{aporte.user?.full_name || 'Usuario'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(Number(aporte.amount))}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{new Date(aporte.created_at).toLocaleDateString('es-CO')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {aporte.archivos_adjuntos && aporte.archivos_adjuntos.length > 0 ? (
                        <button
                          onClick={() => natillera.onViewFiles(aporte.archivos_adjuntos)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          📎 {aporte.archivos_adjuntos.length} archivo{aporte.archivos_adjuntos.length !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span className="text-gray-400">Sin archivos</span>
                      )}
                    </td>
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(item.totalAportado)}</td>
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
              <span className="text-lg font-bold text-green-800">{formatCurrency(Math.round(Number(balance.efectivo)))}</span>
            </div>
            <div className="p-4 rounded-xl border bg-yellow-50 border-yellow-300 shadow-sm flex flex-col items-center">
              <span className="text-2xl mb-1">💸</span>
              <span className="font-semibold text-yellow-900">Préstamos</span>
              <span className="text-lg font-bold text-yellow-800">{formatCurrency(Math.round(Number(balance.prestamos)))}</span>
            </div>
            <div className="p-4 rounded-xl border bg-blue-50 border-blue-300 shadow-sm flex flex-col items-center">
              <span className="text-2xl mb-1">📈</span>
              <span className="font-semibold text-blue-900">Ingresos</span>
              <span className="text-lg font-bold text-blue-800">{formatCurrency(Math.round(Number(balance.ingresos)))}</span>
            </div>
            <div className="p-4 rounded-xl border bg-red-50 border-red-300 shadow-sm flex flex-col items-center">
              <span className="text-2xl mb-1">📉</span>
              <span className="font-semibold text-red-900">Gastos</span>
              <span className="text-lg font-bold text-red-800">{formatCurrency(Math.round(Number(balance.gastos)))}</span>
            </div>
            <div className="p-4 rounded-xl border bg-purple-50 border-purple-300 shadow-sm flex flex-col items-center">
              <span className="text-2xl mb-1">🏦</span>
              <span className="font-semibold text-purple-900">Capital Disponible</span>
              <span className="text-lg font-bold text-purple-800">{formatCurrency(Math.round(Number(balance.capital_disponible)))}</span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700">No hay datos financieros disponibles.</div>
        )}
      </div>
    </>
  );
}
