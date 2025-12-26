// src/lib/calculosNatillera.ts
import { Natillera, Aporte } from '../types';

/**
 * Calcula el total aportado y el porcentaje de participación de cada miembro de la natillera.
 */
export function calcularAportesTotales(natillera: Natillera, aportes: Aporte[]) {
  if (!natillera || !aportes || !natillera.members || natillera.members.length === 0) return [];
  // Sumar solo aportes aprobados
  const aportesAprobados = aportes.filter(a => a.status === 'aprobado');
  const totalesPorId: Record<number, number> = {};
  for (const member of natillera.members) {
    totalesPorId[member.id] = 0;
  }
  for (const aporte of aportesAprobados) {
    if (totalesPorId[aporte.user_id] !== undefined) {
      totalesPorId[aporte.user_id] += aporte.amount;
    }
  }
  const totalGlobal = Object.values(totalesPorId).reduce((a, b) => a + b, 0);
  return natillera.members.map(member => ({
    user: member,
    totalAportado: totalesPorId[member.id],
    porcentaje: totalGlobal > 0 ? (totalesPorId[member.id] * 100) / totalGlobal : 0,
  }));
}
