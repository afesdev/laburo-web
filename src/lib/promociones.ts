import api from './api';
import type { Promocion, PlanPromocion } from '../types/promocion';

export function getPlanes(): Promise<PlanPromocion[]> {
  return api.get('/promociones/planes').then((r) => r.data);
}

export function getActivas(): Promise<Promocion[]> {
  return api.get('/promociones/activas').then((r) => r.data);
}

export function getMisPromociones(): Promise<Promocion[]> {
  return api.get('/promociones/mis-promociones').then((r) => r.data);
}

export function getPromocion(id: number): Promise<Promocion> {
  return api.get(`/promociones/${id}`).then((r) => r.data);
}

export function crearPromocion(data: {
  tipo: string;
  plan_id: number;
  imagen_url?: string;
  titulo?: string;
  descripcion?: string;
  url_destino?: string;
  publicacion_id?: number;
  mensaje_personalizado?: string;
}): Promise<Promocion> {
  return api.post('/promociones', data).then((r) => r.data);
}

export function registrarPago(
  id: number,
  data: {
    monto: number;
    metodo_pago: string;
    referencia_externa?: string;
    notas?: string;
  },
): Promise<{ pago: any; promocion: Promocion }> {
  return api.post(`/promociones/${id}/pagar`, data).then((r) => r.data);
}

export function cancelarPromocion(id: number): Promise<Promocion> {
  return api.patch(`/promociones/${id}/cancelar`).then((r) => r.data);
}

export function registrarClic(id: number): Promise<void> {
  return api.patch(`/promociones/${id}/clic`);
}

export function subirImagenBanner(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/uploads/banners', fd).then((r) => r.data);
}
