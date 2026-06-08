export interface PlanPromocion {
  id: number;
  nombre: string;
  precio: number;
  duracion_dias: number;
  posicion_preferente: number;
  slots_disponibles: number;
}

export interface PromocionBannerData {
  imagen_url: string;
  titulo?: string;
  descripcion?: string;
  url_destino: string;
}

export interface PromocionPerfilData {
  mensaje_personalizado?: string;
}

export interface PromocionPublicacionData {
  publicacion: any;
}

export interface PagoPromocionData {
  id: number;
  monto: number;
  metodo_pago: string;
  estado: string;
  referencia_externa?: string;
  notas?: string;
}

export interface Promocion {
  id: number;
  tipo: 'banner' | 'perfil' | 'publicacion';
  estado: 'pendiente_pago' | 'pendiente_aprobacion' | 'activa' | 'rechazada' | 'finalizada' | 'cancelada';
  plan: PlanPromocion;
  profesional?: any;
  impresiones: number;
  clics: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  created_at?: string;
  pagos: PagoPromocionData[];
  activo?: boolean;
  banner?: PromocionBannerData;
  promo_perfil?: PromocionPerfilData;
  promo_publicacion?: PromocionPublicacionData;
}

export type TipoPromocion = 'banner' | 'perfil' | 'publicacion';
export type EstadoPromocion = 'pendiente_pago' | 'pendiente_aprobacion' | 'activa' | 'rechazada' | 'finalizada' | 'cancelada';
