export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  created_at: string;
  firebase_uid?: string;
}

export interface Natillera {
  id: number;
  name: string;
  monthly_amount: string;
  creator_id: number;
  created_at: string;
  estado: 'activo' | 'inactivo';
  creator: User;
  members?: User[];
}

export interface Aporte {
  id: number;
  amount: number;
  month: number;
  year: number;
  user_id: number;
  natillera_id: number;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  user: User;
  natillera?: Natillera;
  archivos_adjuntos_count?: number;
}

export interface Transaccion {
  id: number;
  natillera_id: number;
  tipo: 'efectivo' | 'prestamo' | 'ingreso' | 'gasto';
  categoria: string;
  monto: string;
  descripcion: string;
  creado_por: number;
  created_at: string;
  creador: User;
  prestamo_id?: number;
}

export interface Invitacion {
  id: number;
  natillera_id: number;
  invitado_email: string;
  invitado_por: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  created_at: string;
  invitador: User;
  natillera: Natillera;
}

export interface Prestamo {
  id: number;
  natillera_id: number;
  monto: string;
  tasa_interes: string;
  plazo_meses: number;
  nombre_prestatario: string;
  telefono_prestatario?: string;
  email_prestatario?: string;
  direccion_prestatario?: string;
  referente_id: number;
  notas?: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: 'activo' | 'pagado' | 'vencido' | 'cancelado';
  monto_pagado: string;
  creado_por: number;
  created_at: string;
  updated_at: string;
  referente: User;
  creador: User;
}

export interface PrestamoDetalle extends Prestamo {
  monto_pendiente: string;
  interes_total: string;
  monto_total: string;
  dias_restantes: number;
}

export interface Balance {
  efectivo: string;
  prestamos: string;
  ingresos: string;
  gastos: string;
  capital_disponible: string;
}

export interface ResumenPrestamos {
  total_activos: number;
  monto_prestado: string;
  monto_por_recuperar: string;
  monto_recuperado: string;
}

export interface Sorteo {
  id: number;
  natillera_id: number;
  tipo: 'loteria' | 'rifa';
  titulo: string;
  descripcion?: string;
  fecha_creacion: string;
  fecha_sorteo?: string;
  estado: 'activo' | 'finalizado';
  creador_id: number;
  numero_ganador?: string;
  creador: User;
  natillera: Natillera;
}

export interface SorteoFinalizado extends Sorteo {
  ganador?: User;
}

export interface BilleteLoteria {
  id: number;
  sorteo_id: number;
  numero: string;
  estado: 'disponible' | 'tomado';
  tomado_por?: number;
  fecha_tomado?: string;
  pagado: boolean;
  usuario?: User;
}
