import api from './api';

export async function fetchMisLikes(): Promise<number[]> {
  const res = await api.get('/likes-publicaciones/mis-likes');
  return res.data;
}
