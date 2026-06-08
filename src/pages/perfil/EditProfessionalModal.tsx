import { useState, useRef } from 'react';
import {
  X, Plus, Trash2, Clock, MapPin, AlignLeft, Upload,
  Search, Loader2, Eye, EyeOff, ChevronRight, Check,
  Briefcase, Link2, DollarSign, Camera,
} from 'lucide-react';
import { uploadFile } from '../../lib/publicaciones';

/* ─── Constantes ─── */
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const TABS = [
  { id: 'perfil',      label: 'Perfil',      icon: AlignLeft  },
  { id: 'servicios',   label: 'Servicios',   icon: Briefcase  },
  { id: 'horarios',    label: 'Horarios',    icon: Clock      },
  { id: 'ubicaciones', label: 'Ubicaciones', icon: MapPin     },
  { id: 'enlaces',     label: 'Enlaces',     icon: Link2      },
] as const;
type TabId = typeof TABS[number]['id'];

/* ─── Tipos de formulario ─── */
interface ServicioForm {
  nombre: string;
  descripcion: string;
  duracion_estimada_min: string;
  precio_min: string;
  precio_max: string;
}
interface HorarioForm  { dia_semana: number; hora_apertura: string; hora_cierre: string; activo: boolean }
interface UbicacionForm {
  direccion: string; ciudad: string; pais: string;
  es_principal: boolean; latitud: string; longitud: string;
  visible_en_mapa: boolean;
}
interface EnlaceForm   { plataforma: string; url: string }

/* ─── Props ─── */
interface Props {
  initial: {
    foto_perfil_url: string | null;
    descripcion_perfil: string | null;
    servicios: {
      nombre: string; descripcion: string | null; duracion_estimada_min: number | null;
      preciosReferenciales?: { precio_min: number; precio_max: number | null }[];
    }[];
    horariosAtencion: { dia_semana: number; hora_apertura: string; hora_cierre: string; activo: boolean }[];
    ubicaciones: { direccion: string; ciudad: string; pais: string; es_principal: boolean; latitud: number | null; longitud: number | null; visible_en_mapa: boolean }[];
    enlacesProfesionales: { plataforma: string; url: string }[];
  };
  onSave: (data: {
    foto_perfil_url: string;
    descripcion_perfil: string;
    servicios: ServicioForm[];
    horarios: HorarioForm[];
    ubicaciones: UbicacionForm[];
    enlaces: EnlaceForm[];
  }) => void;
  onClose: () => void;
  isPending: boolean;
}

/* ─── Componente principal ─── */
export default function EditProfessionalModal({ initial, onSave, onClose, isPending }: Props) {
  const [tab, setTab]               = useState<TabId>('perfil');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [fotoUrl, setFotoUrl]         = useState(initial.foto_perfil_url || '');
  const [descripcion, setDescripcion] = useState(initial.descripcion_perfil || '');

  const [servicios, setServicios] = useState<ServicioForm[]>(
    initial.servicios.map((s) => ({
      nombre: s.nombre,
      descripcion: s.descripcion || '',
      duracion_estimada_min: s.duracion_estimada_min?.toString() || '',
      precio_min: s.preciosReferenciales?.[0]?.precio_min?.toString() || '',
      precio_max: s.preciosReferenciales?.[0]?.precio_max?.toString() || '',
    }))
  );

  const [horarios, setHorarios] = useState<HorarioForm[]>(
    initial.horariosAtencion.map((h) => ({ ...h }))
  );

  const [ubicaciones, setUbicaciones] = useState<UbicacionForm[]>(
    initial.ubicaciones.map((u) => ({
      direccion: u.direccion, ciudad: u.ciudad, pais: u.pais,
      es_principal: u.es_principal,
      latitud: u.latitud?.toString() || '',
      longitud: u.longitud?.toString() || '',
      visible_en_mapa: u.visible_en_mapa ?? true,
    }))
  );

  const [enlaces, setEnlaces] = useState<EnlaceForm[]>(
    initial.enlacesProfesionales.map((e) => ({ ...e }))
  );

  const [geocodingIdx, setGeocodingIdx] = useState<number | null>(null);

  /* ─── Handlers ─── */
  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const result = await uploadFile(file, 'profesionales');
      setFotoUrl(result.url);
    } catch {
      alert('Error al subir la imagen');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const geocodeDireccion = async (idx: number) => {
    const u = ubicaciones[idx];
    const q = [u.direccion, u.ciudad, u.pais].filter(Boolean).join(', ');
    if (!q) return;
    setGeocodingIdx(idx);
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=co`,
        { headers: { 'User-Agent': 'OficiosApp/1.0' } },
      );
      const data = await res.json();
      if (data.length > 0) {
        const c = [...ubicaciones];
        c[idx].latitud  = data[0].lat;
        c[idx].longitud = data[0].lon;
        setUbicaciones(c);
      } else {
        alert('No se encontraron coordenadas para esa dirección');
      }
    } catch {
      alert('Error al buscar la dirección');
    } finally {
      setGeocodingIdx(null);
    }
  };

  const handleSave = () => {
    onSave({ foto_perfil_url: fotoUrl, descripcion_perfil: descripcion, servicios, horarios, ubicaciones, enlaces });
  };

  /* helpers de listas */
  const updS = (i: number, k: keyof ServicioForm, v: string) => { const c = [...servicios]; c[i][k] = v; setServicios(c); };
  const updU = <K extends keyof UbicacionForm>(i: number, k: K, v: UbicacionForm[K]) => { const c = [...ubicaciones]; c[i][k] = v; setUbicaciones(c); };

  const currentTabIdx = TABS.findIndex((t) => t.id === tab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col z-10 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-[18px] font-black text-gray-900">Editar perfil profesional</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Los cambios se guardan al presionar "Guardar"</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-100 overflow-x-auto flex-shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((t, _) => {
            const Icon   = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {/* indicador de contenido */}
                {t.id === 'servicios'   && servicios.length   > 0 && <Dot active={active} count={servicios.length} />}
                {t.id === 'horarios'    && horarios.filter(h => h.activo).length > 0 && <Dot active={active} count={horarios.filter(h=>h.activo).length} />}
                {t.id === 'ubicaciones' && ubicaciones.length > 0 && <Dot active={active} count={ubicaciones.length} />}
                {t.id === 'enlaces'     && enlaces.length     > 0 && <Dot active={active} count={enlaces.length} />}
              </button>
            );
          })}
        </div>

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* ── TAB: Perfil ── */}
          {tab === 'perfil' && (
            <div className="p-6 space-y-6">

              {/* Foto */}
              <div>
                <SectionLabel>Foto de perfil</SectionLabel>
                <div className="flex items-center gap-5 mt-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 ring-2 ring-gray-200">
                      {fotoUrl ? (
                        <img src={fotoUrl} alt="" className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-7 h-7 text-indigo-300" />
                        </div>
                      )}
                    </div>
                    {uploadingPhoto && (
                      <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all text-[13px] font-semibold ${
                      uploadingPhoto
                        ? 'border-gray-200 text-gray-300'
                        : 'border-indigo-200 text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50'
                    }`}>
                      <Upload className="w-4 h-4" />
                      {uploadingPhoto ? 'Subiendo...' : 'Subir foto'}
                      <input ref={fotoInputRef} type="file" accept="image/*" onChange={handleFotoUpload}
                        className="hidden" disabled={uploadingPhoto} />
                    </label>
                    <input
                      type="url" value={fotoUrl} onChange={(e) => setFotoUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                      placeholder="O pega una URL de imagen"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <SectionLabel>Descripción profesional</SectionLabel>
                <div className="relative mt-3">
                  <textarea
                    rows={5} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                    maxLength={800}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-[14px] text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none leading-relaxed"
                    placeholder="Describe tu experiencia, especialidades y lo que te hace diferente..."
                  />
                  <span className="absolute bottom-3 right-4 text-[11px] text-gray-300">{descripcion.length}/800</span>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Servicios ── */}
          {tab === 'servicios' && (
            <div className="p-6 space-y-3">
              {servicios.length === 0 && (
                <EmptyTabState icon={<Briefcase className="w-7 h-7 text-gray-300" />} text="Agrega los servicios que ofreces" />
              )}

              {servicios.map((s, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">Servicio {i + 1}</span>
                    <button onClick={() => setServicios(servicios.filter((_, j) => j !== i))}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Field label="Nombre del servicio">
                    <input value={s.nombre} onChange={(e) => updS(i, 'nombre', e.target.value)}
                      className={inputCls} placeholder="Ej: Reparación de tuberías" />
                  </Field>

                  <Field label="Descripción (opcional)">
                    <input value={s.descripcion} onChange={(e) => updS(i, 'descripcion', e.target.value)}
                      className={inputCls} placeholder="Breve descripción del servicio" />
                  </Field>

                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Duración (min)">
                      <input type="number" value={s.duracion_estimada_min} onChange={(e) => updS(i, 'duracion_estimada_min', e.target.value)}
                        className={inputCls} placeholder="60" />
                    </Field>
                    <Field label="Precio mín (COP)">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input type="number" value={s.precio_min} onChange={(e) => updS(i, 'precio_min', e.target.value)}
                          className={inputCls + ' pl-8'} placeholder="50000" />
                      </div>
                    </Field>
                    <Field label="Precio máx (COP)">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input type="number" value={s.precio_max} onChange={(e) => updS(i, 'precio_max', e.target.value)}
                          className={inputCls + ' pl-8'} placeholder="150000" />
                      </div>
                    </Field>
                  </div>
                </div>
              ))}

              <AddButton onClick={() => setServicios([...servicios, { nombre: '', descripcion: '', duracion_estimada_min: '', precio_min: '', precio_max: '' }])}>
                Agregar servicio
              </AddButton>
            </div>
          )}

          {/* ── TAB: Horarios ── */}
          {tab === 'horarios' && (
            <div className="p-6">
              <p className="text-[13px] text-gray-400 mb-4">Activa los días que atiendes y configura tu horario.</p>
              <div className="space-y-2">
                {DIAS.map((dia, diaIdx) => {
                  const h      = horarios.find((h) => h.dia_semana === diaIdx);
                  const activo = h?.activo ?? false;
                  return (
                    <div
                      key={dia}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        activo ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      {/* Toggle día */}
                      <button
                        onClick={() => {
                          if (activo) {
                            setHorarios(horarios.filter((x) => x.dia_semana !== diaIdx));
                          } else {
                            setHorarios([...horarios, { dia_semana: diaIdx, hora_apertura: '09:00', hora_cierre: '18:00', activo: true }]);
                          }
                        }}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          activo ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {activo && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </button>

                      <span className={`w-24 text-[13px] font-bold flex-shrink-0 ${activo ? 'text-indigo-700' : 'text-gray-400'}`}>
                        {dia}
                      </span>

                      {activo && h ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time" value={h.hora_apertura}
                            onChange={(e) => { const c = [...horarios]; const idx = c.findIndex(x => x.dia_semana === diaIdx); if (idx >= 0) c[idx].hora_apertura = e.target.value; setHorarios(c); }}
                            className="flex-1 px-3 py-1.5 border border-indigo-200 bg-white rounded-lg text-[13px] text-indigo-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <span className="text-gray-400 text-[12px] font-semibold">–</span>
                          <input
                            type="time" value={h.hora_cierre}
                            onChange={(e) => { const c = [...horarios]; const idx = c.findIndex(x => x.dia_semana === diaIdx); if (idx >= 0) c[idx].hora_cierre = e.target.value; setHorarios(c); }}
                            className="flex-1 px-3 py-1.5 border border-indigo-200 bg-white rounded-lg text-[13px] text-indigo-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                      ) : (
                        <span className="text-[12px] text-gray-300 flex-1">No disponible</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB: Ubicaciones ── */}
          {tab === 'ubicaciones' && (
            <div className="p-6 space-y-3">
              {ubicaciones.length === 0 && (
                <EmptyTabState icon={<MapPin className="w-7 h-7 text-gray-300" />} text="Agrega dónde ofreces tus servicios" />
              )}

              {ubicaciones.map((u, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">Ubicación {i + 1}</span>
                      {u.es_principal && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full">Principal</span>
                      )}
                    </div>
                    <button onClick={() => setUbicaciones(ubicaciones.filter((_, j) => j !== i))}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Field label="Dirección">
                    <input value={u.direccion} onChange={(e) => updU(i, 'direccion', e.target.value)}
                      className={inputCls} placeholder="Ej: Cra 15 #85-60" />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Ciudad">
                      <input value={u.ciudad} onChange={(e) => updU(i, 'ciudad', e.target.value)}
                        className={inputCls} placeholder="Bogotá" />
                    </Field>
                    <Field label="País">
                      <input value={u.pais} onChange={(e) => updU(i, 'pais', e.target.value)}
                        className={inputCls} placeholder="Colombia" />
                    </Field>
                  </div>

                  {/* Coordenadas */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Latitud">
                      <div className="flex gap-1.5">
                        <input type="number" step="any" value={u.latitud}
                          onChange={(e) => updU(i, 'latitud', e.target.value)}
                          className={inputCls + ' flex-1'} placeholder="4.711" />
                        <button
                          type="button" onClick={() => geocodeDireccion(i)} disabled={geocodingIdx === i}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-colors disabled:opacity-40 flex-shrink-0"
                          title="Buscar coordenadas automáticamente"
                        >
                          {geocodingIdx === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>
                    <Field label="Longitud">
                      <input type="number" step="any" value={u.longitud}
                        onChange={(e) => updU(i, 'longitud', e.target.value)}
                        className={inputCls} placeholder="-74.072" />
                    </Field>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-3 pt-1">
                    {/* Principal */}
                    <button
                      onClick={() => updU(i, 'es_principal', !u.es_principal)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all ${
                        u.es_principal
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {u.es_principal && <Check className="w-3 h-3" />}
                      Principal
                    </button>

                    {/* Visibilidad mapa */}
                    <button
                      onClick={() => updU(i, 'visible_en_mapa', !u.visible_en_mapa)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all ${
                        u.visible_en_mapa
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {u.visible_en_mapa
                        ? <><Eye className="w-3.5 h-3.5" /> Visible en mapa</>
                        : <><EyeOff className="w-3.5 h-3.5" /> Oculto en mapa</>
                      }
                    </button>
                  </div>
                </div>
              ))}

              <AddButton onClick={() => setUbicaciones([...ubicaciones, { direccion: '', ciudad: '', pais: 'Colombia', es_principal: false, latitud: '', longitud: '', visible_en_mapa: true }])}>
                Agregar ubicación
              </AddButton>
            </div>
          )}

          {/* ── TAB: Enlaces ── */}
          {tab === 'enlaces' && (
            <div className="p-6 space-y-3">
              {enlaces.length === 0 && (
                <EmptyTabState icon={<Link2 className="w-7 h-7 text-gray-300" />} text="Agrega tus redes o sitio web" />
              )}

              {enlaces.map((e, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">Enlace {i + 1}</span>
                    <button onClick={() => setEnlaces(enlaces.filter((_, j) => j !== i))}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Plataforma">
                      <input value={e.plataforma}
                        onChange={(ev) => { const c = [...enlaces]; c[i].plataforma = ev.target.value; setEnlaces(c); }}
                        className={inputCls} placeholder="WhatsApp, Instagram..." />
                    </Field>
                    <Field label="URL">
                      <input value={e.url}
                        onChange={(ev) => { const c = [...enlaces]; c[i].url = ev.target.value; setEnlaces(c); }}
                        className={inputCls} placeholder="https://..." />
                    </Field>
                  </div>
                </div>
              ))}

              <AddButton onClick={() => setEnlaces([...enlaces, { plataforma: '', url: '' }])}>
                Agregar enlace
              </AddButton>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          {/* Navegación entre tabs */}
          <div className="flex items-center gap-1">
            {currentTabIdx > 0 && (
              <button
                onClick={() => setTab(TABS[currentTabIdx - 1].id)}
                className="flex items-center gap-1 px-3 py-2 text-[13px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              >
                ← {TABS[currentTabIdx - 1].label}
              </button>
            )}
            {currentTabIdx < TABS.length - 1 && (
              <button
                onClick={() => setTab(TABS[currentTabIdx + 1].id)}
                className="flex items-center gap-1 px-3 py-2 text-[13px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {TABS[currentTabIdx + 1].label} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition-colors shadow-sm"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                : <><Check className="w-4 h-4" /> Guardar cambios</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-componentes ─── */
const inputCls = 'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{children}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Dot({ active, count }: { active: boolean; count: number }) {
  return (
    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
      active ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-600'
    }`}>
      {count}
    </span>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-[13px] font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
    >
      <Plus className="w-4 h-4" /> {children}
    </button>
  );
}

function EmptyTabState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-[13px] text-gray-400 font-medium">{text}</p>
    </div>
  );
}
