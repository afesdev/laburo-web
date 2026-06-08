import api from './api';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  nombre_completo: string;
  email: string;
  password: string;
  telefono: string;
  rol: 'cliente' | 'profesional';
}

export interface AuthResponse {
  access_token: string;
  usuario: {
    id: number;
    nombre_completo: string;
    email: string;
    telefono: string;
    rol: string;
  };
}

export interface FullProfile {
  id: number;
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: string;
  fecha_registro: string;
  estado: string;
  profesional: {
    id: number;
    descripcion_perfil: string | null;
    foto_perfil_url: string | null;
    ciudad: string;
    categoria: { id: number; nombre: string } | null;
    servicios: {
      id: number;
      nombre: string;
      descripcion: string | null;
      duracion_estimada_min: number | null;
      preciosReferenciales: { id: number; precio_min: number; precio_max: number | null; descripcion_precio: string | null }[];
    }[];
    horariosAtencion: { id: number; dia_semana: number; hora_apertura: string; hora_cierre: string; activo: boolean }[];
    ubicaciones: { id: number; direccion: string; ciudad: string; pais: string; es_principal: boolean }[];
    enlacesProfesionales: { id: number; plataforma: string; url: string }[];
    verificacion: { id: number; tipo_documento: string; estado: string } | null;
  } | null;
}

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const res = await api.post('/auth/login', dto);
  return res.data;
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const res = await api.post('/auth/register', dto);
  return res.data;
}

export async function fetchProfile(): Promise<FullProfile> {
  const res = await api.get('/auth/profile');
  return res.data;
}

export async function forgotPassword(email: string): Promise<{ mensaje: string }> {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
}

export async function resetPassword(token: string, password: string): Promise<{ mensaje: string }> {
  const res = await api.post('/auth/reset-password', { token, password });
  return res.data;
}

export interface FcmToken {
  id: number;
  token: string;
  plataforma: string;
  ultimo_uso: string;
  activo: boolean;
}

export async function fetchFcmTokens(): Promise<FcmToken[]> {
  const res = await api.get('/auth/fcm-tokens');
  return res.data;
}

export async function deleteFcmToken(id: number): Promise<void> {
  await api.delete(`/auth/fcm-tokens/${id}`);
}
