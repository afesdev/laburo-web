import api from './api';
import type { Resena, PaginatedResponse, CreateResenaDto } from '../types/publicacion';

export async function fetchResenas(
  publicacionId: number,
  params?: { page?: number; limit?: number },
): Promise<PaginatedResponse<Resena>> {
  const res = await api.get(`/publicaciones/${publicacionId}/resenas`, { params });
  return res.data;
}

export async function createResena(
  publicacionId: number,
  dto: CreateResenaDto,
): Promise<Resena> {
  const res = await api.post(`/publicaciones/${publicacionId}/resenas`, dto);
  return res.data;
}
