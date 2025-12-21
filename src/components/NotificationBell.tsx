'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNatilleraIdFromPath } from '@/lib/useNatilleraIdFromPath';

export default function NotificationBell() {
  const { counts, loading, isCreator } = useNotifications();
  const { user } = useAuth();
  const natilleraId = useNatilleraIdFromPath();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!natilleraId || !user) return null;

  const totalNotifications = counts.total;

  const notifications = isCreator ? [
    { label: 'Aportes pendientes', count: counts.aportesPendientes, icon: '💰', href: `/natilleras/${natilleraId}/aportes` },
    { label: 'Préstamos pendientes', count: counts.prestamosPendientes, icon: '💸', href: `/natilleras/${natilleraId}/prestamos` },
    { label: 'Pagos pendientes', count: counts.pagosPendientes, icon: '💳', href: `/natilleras/${natilleraId}/prestamos` },
    { label: 'Invitaciones respondidas', count: counts.invitacionesRespondidas, icon: '👥', href: `/natilleras/${natilleraId}` },
  ] : [
    { label: 'Aportes aprobados', count: counts.aportesAprobados, icon: '✅', href: `/natilleras/${natilleraId}/aportes` },
    { label: 'Préstamos aprobados', count: counts.prestamosAprobados, icon: '✅', href: `/natilleras/${natilleraId}/prestamos` },
    { label: 'Pagos aprobados', count: counts.pagosAprobados, icon: '✅', href: `/natilleras/${natilleraId}/prestamos` },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative flex items-center justify-center w-10 h-10 text-white hover:text-emerald-200 transition-all duration-300 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20"
        title="Notificaciones"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5h5l-5 5v-5H9V7h6z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {totalNotifications > 99 ? '99+' : totalNotifications}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-xl">
            <h3 className="text-sm font-semibold text-gray-800">Notificaciones</h3>
            <p className="text-xs text-gray-600">Actualizaciones recientes</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="text-xs mt-2">Cargando...</p>
              </div>
            ) : notifications.filter(n => n.count > 0).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No hay notificaciones nuevas</p>
              </div>
            ) : (
              notifications.filter(n => n.count > 0).map((notification, index) => (
                <a
                  key={index}
                  href={notification.href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                  onClick={() => setShowDropdown(false)}
                >
                  <span className="text-lg">{notification.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{notification.label}</p>
                    <p className="text-xs text-gray-600">{notification.count} pendiente{notification.count !== 1 ? 's' : ''}</p>
                  </div>
                  {notification.count > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
                      {notification.count}
                    </span>
                  )}
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}