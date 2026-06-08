import api from './api';

export async function toggleLike(publicacionId: number): Promise<{ liked: boolean; total_likes: number }> {
  const res = await api.post('/likes-publicaciones/toggle', { publicacion_id: publicacionId });
  return res.data;
}
