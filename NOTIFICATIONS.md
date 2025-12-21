# Mejora del Sistema de Notificaciones

## Problema Actual
El sistema actual usa **polling periódico** cada 5 minutos para actualizar los contadores de notificaciones. Esto no es óptimo porque:

1. **Demora**: Los usuarios deben esperar hasta 5 minutos para ver actualizaciones
2. **Ineficiente**: Hace requests innecesarios al servidor
3. **No es en tiempo real**: No refleja cambios inmediatos

## Solución Implementada (Intermedia)
Se implementó un sistema de **invalidación manual** que actualiza las notificaciones inmediatamente cuando se aprueban/rechazan elementos:

- ✅ Actualización inmediata al aprobar/rechazar aportes
- ✅ Actualización inmediata al aprobar préstamos/pagos
- ✅ Polling reducido a 5 minutos (antes 30 segundos)
- ✅ Eventos personalizados para comunicación entre componentes

## Solución a Largo Plazo: WebSockets

Para una experiencia completamente en tiempo real, implementar WebSockets:

### Backend (FastAPI)
```python
from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect

@app.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: int):
    await websocket.accept()
    # Lógica para enviar notificaciones en tiempo real
    # Cuando se aprueba algo, enviar actualización a todos los usuarios relevantes
```

### Frontend (Next.js)
```typescript
import { useEffect, useState } from 'react';

export function useWebSocketNotifications(userId: string) {
  const [notifications, setNotifications] = useState({});

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/notifications/${userId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(data);
    };

    return () => ws.close();
  }, [userId]);

  return notifications;
}
```

### Ventajas de WebSockets:
- ✅ **Tiempo real**: Actualizaciones instantáneas
- ✅ **Eficiente**: Solo envía datos cuando hay cambios
- ✅ **Bidireccional**: Puede enviar confirmaciones
- ✅ **Escalable**: Mejor que polling para múltiples usuarios

## Implementación Recomendada

1. **Fase 1** (Actual): Invalidación manual + polling reducido ✅
2. **Fase 2** (Próxima): Implementar WebSockets para tiempo real
3. **Fase 3** (Futuro): Agregar notificaciones push del navegador

## Archivos Modificados

- `src/hooks/useNotifications.ts`: Sistema de invalidación
- `src/components/prestamos/PrestamosCreador.tsx`: Invalidación en aprobaciones
- `src/app/natilleras/[id]/page.tsx`: Invalidación en aportes

El sistema actual es una mejora significativa sobre el polling puro, pero WebSockets sería la solución definitiva para tiempo real.