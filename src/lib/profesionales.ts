import api from './api';
import type { Profesional } from '../types/profesional';

export async function fetchProfesional(id: number): Promise<Profesional> {
  const res = await api.get(`/profesionales/${id}`);
  return res.data;
}

export async function fetchPromedioResenas(profesionalId: number) {
  const res = await api.get(`/resenas/promedio/${profesionalId}`);
  return res.data as { promedio: string; total: number };
}

export interface SearchProfesionalParams {
  q?: string;
  ciudad?: string;
  categoria?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedProfesionales {
  data: Profesional[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function searchProfesionales(params: SearchProfesionalParams): Promise<PaginatedProfesionales> {
  const res = await api.get('/profesionales', { params });
  return res.data;
}

export interface SearchNearbyParams {
  lat: number;
  lng: number;
  radio_km: number;
  page?: number;
  limit?: number;
}

export async function searchNearby(params: SearchNearbyParams): Promise<PaginatedProfesionales> {
  const res = await api.get('/profesionales/cerca', { params });
  return res.data;
}
