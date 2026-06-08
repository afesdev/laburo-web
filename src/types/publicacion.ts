export interface UsuarioInfo {
  id: number;
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: string;
  fecha_registro: string;
  estado: string;
}

export interface CategoriaInfo {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono_url: string | null;
}

export interface ProfesionalInfo {
  id: number;
  usuario_id: number;
  categoria_id: number;
  descripcion_perfil: string | null;
  foto_perfil_url: string | null;
  ciudad: string;
  usuario: UsuarioInfo;
  categoria: CategoriaInfo;
}

export interface FotoPublicacion {
  id: number;
  imagen_url: string;
  orden: number;
}

export interface Publicacion {
  id: number;
  titulo: string;
  descripcion: string | null;
  imagen_url: string;
  video_url: string | null;
  fecha_creacion: string;
  fotos: FotoPublicacion[];
  profesional: ProfesionalInfo;
  likes_count: number;
  user_liked: boolean;
  promedio_resenas?: number;
  total_resenas?: number;
}

export interface Resena {
  id: number;
  cliente_id: number;
  profesional_id: number;
  publicacion_id: number | null;
  puntuacion: number;
  comentario: string | null;
  fecha_creacion: string;
  cliente: UsuarioInfo;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CreatePublicacionDto {
  profesional_id: number;
  titulo: string;
  descripcion?: string;
  imagen_url: string;
  video_url?: string;
  fotos_urls?: string[];
}

export interface CreateResenaDto {
  puntuacion: number;
  comentario?: string;
}
