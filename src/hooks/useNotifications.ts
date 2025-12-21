'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { useNatilleraIdFromPath } from '@/lib/useNatilleraIdFromPath';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationCounts {
  aportesPendientes: number;
  prestamosPendientes: number;
  pagosPendientes: number;
  invitacionesRespondidas: number;
  aportesAprobados: number;
  prestamosAprobados: number;
  pagosAprobados: number;
  total: number;
}

export function useNotifications() {
  const [counts, setCounts] = useState<NotificationCounts>({
    aportesPendientes: 0,
    prestamosPendientes: 0,
    pagosPendientes: 0,
    invitacionesRespondidas: 0,
    aportesAprobados: 0,
    prestamosAprobados: 0,
    pagosAprobados: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const natilleraId = useNatilleraIdFromPath();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!natilleraId || !user) return;

    try {
      setLoading(true);

      // Verificar si es creador
      const natilleraRes = await fetchAPI(`/natilleras/${natilleraId}`);
      if (natilleraRes.ok) {
        const natilleraData = await natilleraRes.json();
        const userIsCreator = natilleraData.creator_id === user.id;
        setIsCreator(userIsCreator);

        // Llamadas según el rol
        const promises = [];

        if (userIsCreator) {
          promises.push(
            fetchAPI(`/aportes/natillera/${natilleraId}/pendientes/count`),
            fetchAPI(`/prestamos/natillera/${natilleraId}/pendientes/count`),
            fetchAPI(`/prestamos/pagos/natillera/${natilleraId}/pendientes/count`),
            fetchAPI(`/invitaciones/natillera/${natilleraId}/respondidas/count`)
          );
        } else {
          promises.push(
            fetchAPI(`/aportes/my-aportes/aprobados/count?natillera_id=${natilleraId}`),
            fetchAPI(`/prestamos/my-prestamos/aprobados/count?natillera_id=${natilleraId}`),
            fetchAPI(`/prestamos/pagos/my-pagos/aprobados/count?natillera_id=${natilleraId}`)
          );
        }

        const responses = await Promise.all(promises);
        const results = await Promise.all(responses.map(res => res.ok ? res.json() : { count: 0 }));

        if (userIsCreator) {
          const [aportes, prestamos, pagos, invitaciones] = results;
          setCounts({
            aportesPendientes: aportes.count || 0,
            prestamosPendientes: prestamos.count || 0,
            pagosPendientes: pagos.count || 0,
            invitacionesRespondidas: invitaciones.count || 0,
            aportesAprobados: 0,
            prestamosAprobados: 0,
            pagosAprobados: 0,
            total: (aportes.count || 0) + (prestamos.count || 0) + (pagos.count || 0) + (invitaciones.count || 0),
          });
        } else {
          const [aportes, prestamos, pagos] = results;
          setCounts({
            aportesPendientes: 0,
            prestamosPendientes: 0,
            pagosPendientes: 0,
            invitacionesRespondidas: 0,
            aportesAprobados: aportes.count || 0,
            prestamosAprobados: prestamos.count || 0,
            pagosAprobados: pagos.count || 0,
            total: (aportes.count || 0) + (prestamos.count || 0) + (pagos.count || 0),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [natilleraId, user]);

  return { counts, loading, isCreator, refetch: fetchNotifications };
}