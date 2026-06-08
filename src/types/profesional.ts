export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono_url: string | null;
}

export interface Usuario {
  id: number;
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: string;
  fecha_registro: string;
  estado: string;
}

export interface PrecioReferencial {
  id: number;
  servicio_id: number;
  precio_min: number;
  precio_max: number | null;
  moneda: string;
  descripcion_precio: string | null;
}

export interface Servicio {
  id: number;
  profesional_id: number;
  nombre: string;
  descripcion: string | null;
  duracion_estimada_min: number | null;
  preciosReferenciales: PrecioReferencial[];
}

export interface HorarioAtencion {
  id: number;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
}

export interface Ubicacione {
  id: number;
  direccion: string;
  ciudad: string;
  estado: string | null;
  pais: string;
  latitud: number | null;
  longitud: number | null;
  es_principal: boolean;
}

export interface EnlaceProfesional {
  id: number;
  plataforma: string;
  url: string;
}

export interface Verificacione {
  id: number;
  tipo_documento: string;
  estado: string;
}

export interface ResenaProfesional {
  id: number;
  cliente_id?: number;
  puntuacion: number;
  comentario: string | null;
  fecha_creacion: string;
  cliente?: {
    id: number;
    nombre_completo: string;
  };
}

export interface PublicacioneResumida {
  id: number;
  titulo: string;
  imagen_url: string;
  fecha_creacion: string;
  likes_count?: number;
}

export interface Profesional {
  id: number;
  usuario_id: number;
  categoria_id: number;
  descripcion_perfil: string | null;
  foto_perfil_url: string | null;
  ciudad: string;
  categoria: Categoria;
  usuario: Usuario;
  servicios: Servicio[];
  horariosAtencion: HorarioAtencion[];
  ubicaciones: Ubicacione[];
  enlacesProfesionales: EnlaceProfesional[];
  verificacion: Verificacione | null;
  resenas: ResenaProfesional[];
  publicaciones: PublicacioneResumida[];
  promedio_resenas?: number;
  total_resenas?: number;
}
