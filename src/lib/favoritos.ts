import api from './api';

export interface FavoritoProfesional {
  id: number;
  cliente_id: number;
  profesional_id: number;
  profesional: {
    id: number;
    descripcion_perfil: string | null;
    foto_perfil_url: string | null;
    ciudad: string;
    categoria: { id: number; nombre: string } | null;
    usuario: { id: number; nombre_completo: string; telefono: string };
  };
}

export interface PaginatedFavoritos {
  data: FavoritoProfesional[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function fetchFavoritos(clienteId: number, page = 1, limit = 20): Promise<PaginatedFavoritos> {
  const res = await api.get(`/favoritos/${clienteId}`, { params: { page, limit } });
  return res.data;
}

export async function addFavorito(clienteId: number, profesionalId: number): Promise<void> {
  await api.post('/favoritos', { cliente_id: clienteId, profesional_id: profesionalId });
}

export async function removeFavorito(clienteId: number, profesionalId: number): Promise<void> {
  await api.delete(`/favoritos/${clienteId}/${profesionalId}`);
}
