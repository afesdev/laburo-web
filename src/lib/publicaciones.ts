import api from './api';
import type { Publicacion, PaginatedResponse, CreatePublicacionDto } from '../types/publicacion';

export async function fetchPublicaciones(params?: {
  page?: number;
  limit?: number;
  profesional_id?: number;
  categoria_id?: number;
  q?: string;
}): Promise<PaginatedResponse<Publicacion>> {
  const res = await api.get('/publicaciones', { params });
  return res.data;
}

export async function fetchPublicacion(id: number): Promise<Publicacion> {
  const res = await api.get(`/publicaciones/${id}`);
  return res.data;
}

export async function createPublicacion(dto: CreatePublicacionDto): Promise<Publicacion> {
  const res = await api.post('/publicaciones', dto);
  return res.data;
}

export async function updatePublicacion(id: number, dto: Partial<CreatePublicacionDto>): Promise<Publicacion> {
  const res = await api.patch(`/publicaciones/${id}`, dto);
  return res.data;
}

export async function deletePublicacion(id: number): Promise<void> {
  await api.delete(`/publicaciones/${id}`);
}

export async function uploadFile(file: File, folder: string): Promise<{ url: string; fileName: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post(`/uploads/${folder}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
