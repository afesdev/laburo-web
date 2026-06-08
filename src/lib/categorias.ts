import api from './api';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono_url: string | null;
}

export interface PaginatedCategorias {
  data: Categoria[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function fetchCategorias(page = 1, limit = 50): Promise<PaginatedCategorias> {
  const res = await api.get('/categorias', { params: { page, limit } });
  return res.data;
}
