import api from './api';

export interface UpdateProfileDto {
  nombre_completo?: string;
  email?: string;
  telefono?: string;
  password?: string;
}

export interface ServicioInput {
  nombre: string;
  descripcion?: string | null;
  duracion_estimada_min?: number | null;
  precios?: { precio_min: number; precio_max?: number | null; descripcion_precio?: string | null }[];
}

export interface HorarioInput {
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  activo?: boolean;
}

export interface EnlaceInput {
  plataforma: string;
  url: string;
}

export interface UbicacionInput {
  direccion: string;
  ciudad: string;
  pais?: string;
  es_principal?: boolean;
  visible_en_mapa?: boolean;
}

export interface UpdateProfessionalProfileDto {
  categoria_id?: number;
  descripcion_perfil?: string;
  foto_perfil_url?: string;
  ciudad?: string;
  servicios?: ServicioInput[];
  horarios?: HorarioInput[];
  enlaces?: EnlaceInput[];
  ubicaciones?: UbicacionInput[];
}

export interface AuthProfileResponse {
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
    ubicaciones: { id: number; direccion: string; ciudad: string; pais: string; es_principal: boolean; latitud: number | null; longitud: number | null; visible_en_mapa: boolean }[];
    enlacesProfesionales: { id: number; plataforma: string; url: string }[];
    verificacion: { id: number; tipo_documento: string; estado: string } | null;
  } | null;
}

export async function fetchProfile(): Promise<AuthProfileResponse> {
  const res = await api.get('/auth/profile');
  return res.data;
}

export async function updateProfile(dto: UpdateProfileDto): Promise<AuthProfileResponse> {
  const res = await api.patch('/auth/profile', dto);
  return res.data;
}

export async function updateProfessionalProfile(dto: UpdateProfessionalProfileDto): Promise<AuthProfileResponse> {
  const res = await api.patch('/auth/profile/profesional', dto);
  return res.data;
}

export async function toggleVisibilidadUbicacion(ubicacionId: number, visible: boolean): Promise<void> {
  await api.patch(`/auth/profile/profesional/ubicaciones/${ubicacionId}/visibilidad`, {
    visible_en_mapa: visible,
  });
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
