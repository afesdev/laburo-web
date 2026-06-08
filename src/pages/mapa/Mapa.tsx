import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Crosshair, Loader2, MapPin, Star, ChevronRight, Eye, EyeOff, ChevronDown, ChevronUp,
} from 'lucide-react';
import { searchNearby } from '../../lib/profesionales';
import { fetchProfile, toggleVisibilidadUbicacion } from '../../lib/perfil';
import { useAuth } from '../../store/auth';

// Colores por categoría — nombres exactos de la BD
const CAT_COLORS: Record<string, string> = {
  'Plomero / Fontanero':                        '#0EA5E9',
  'Carpintero':                                 '#D97706',
  'Electricista':                               '#EAB308',
  'Pintor':                                     '#EC4899',
  'Médico General':                             '#EF4444',
  'Mecánico Automotriz':                        '#6B7280',
  'Cerrajero':                                  '#71717A',
  'Jardinero / Paisajista':                     '#22C55E',
  'Abogado':                                    '#4F46E5',
  'Contador / Fiscalista':                      '#0D9488',
  'Arquitecto':                                 '#F97316',
  'Técnico en Refrigeración':                   '#06B6D4',
  'Barbero / Estilista':                        '#A855F7',
  'Chef / Cocinero Particular':                 '#F59E0B',
  'Técnico en Reparación de Electrodomésticos': '#3B82F6',
};


function getCatColor(cat?: string) {
  return cat ? (CAT_COLORS[cat] ?? '#6366F1') : '#6366F1';
}

function createMarkerIcon(photoUrl?: string | null, categoria?: string, initial = 'P') {
  const color = getCatColor(categoria);
  const inner = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
    : `<span style="color:white;font-size:13px;font-weight:700">${initial}</span>`;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:42px;height:42px">
        <div style="
          width:38px;height:38px;border-radius:50%;
          border:3px solid white;
          box-shadow:0 4px 12px rgba(0,0,0,0.25);
          overflow:hidden;
          background:${color};
          display:flex;align-items:center;justify-content:center;
        ">${inner}</div>
        <div style="
          position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-top:7px solid ${color};
          filter:drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        "></div>
      </div>
    `,
    iconSize: [42, 48],
    iconAnchor: [21, 48],
    popupAnchor: [0, -52],
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom()); }, [lat, lng]);
  return null;
}

const DEFAULT_COORDS = { lat: 4.711, lng: -74.0721 };
const RADIOS = [5, 10, 25, 50, 100];

export default function Mapa() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radio, setRadio] = useState(25);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedProf, setSelectedProf] = useState<number | null>(null);
  const [showVisPanel, setShowVisPanel] = useState(false);

  // Perfil propio (solo si es profesional)
  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => fetchProfile(),
    enabled: !!user && user.rol === 'profesional',
  });

  const misUbicaciones = profile?.profesional?.ubicaciones ?? [];

  const visMutation = useMutation({
    mutationFn: ({ id, visible }: { id: number; visible: boolean }) =>
      toggleVisibilidadUbicacion(id, visible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['nearby'] });
    },
  });

  const getLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      setCoords(DEFAULT_COORDS);
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
      },
      () => {
        setCoords(DEFAULT_COORDS);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => { getLocation(); }, []);

  const center = coords ?? DEFAULT_COORDS;

  const { data, isLoading } = useQuery({
    queryKey: ['nearby', center.lat, center.lng, radio],
    queryFn: () => searchNearby({ lat: center.lat, lng: center.lng, radio_km: radio, limit: 50 }),
    enabled: !!coords,
  });

  const { data: fallbackData } = useQuery({
    queryKey: ['nearby-fallback', center.lat, center.lng],
    queryFn: () => searchNearby({ lat: center.lat, lng: center.lng, radio_km: 500, limit: 1 }),
    enabled: !!coords && !!data && data.meta.total === 0,
  });

  const profesionales = data?.data ?? [];
  const hasProfesionales = profesionales.length > 0;
  const hasFarProfesionales = (fallbackData?.meta.total ?? 0) > 0;

  return (
    <div className="fixed inset-0 top-16 z-30">

      {/* ── Mapa ── */}
      {coords && (
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={12}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <RecenterMap lat={center.lat} lng={center.lng} />

          {/* Marcador: ubicación propia */}
          <Marker
            position={[center.lat, center.lng]}
            icon={L.divIcon({
              className: '',
              html: `
                <div style="position:relative">
                  <div style="
                    width:18px;height:18px;
                    background:#4F46E5;
                    border:3px solid white;
                    border-radius:50%;
                    box-shadow:0 0 0 6px rgba(79,70,229,0.2);
                  "></div>
                </div>
              `,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            })}
          >
            <Popup className="custom-popup">
              <p className="text-xs font-semibold text-indigo-700">Tu ubicación</p>
            </Popup>
          </Marker>

          {/* Marcadores de profesionales */}
          {profesionales.map((prof) =>
            prof.ubicaciones
              .filter((u) => u.latitud && u.longitud)
              .map((ub) => {
                const initial = prof.usuario.nombre_completo.charAt(0).toUpperCase();
                const catColor = getCatColor(prof.categoria.nombre);
                return (
                  <Marker
                    key={`${prof.id}-${ub.id}`}
                    position={[Number(ub.latitud), Number(ub.longitud)]}
                    icon={createMarkerIcon(prof.foto_perfil_url, prof.categoria.nombre, initial)}
                    eventHandlers={{ click: () => setSelectedProf(prof.id) }}
                  >
                    <Popup className="custom-popup" minWidth={220}>
                      <div className="p-1">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2"
                            style={{ ringColor: catColor }}>
                            {prof.foto_perfil_url ? (
                              <img src={prof.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                                style={{ background: catColor }}>
                                {initial}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[13px] text-gray-900 truncate">
                              {prof.usuario.nombre_completo}
                            </p>
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full text-white mt-0.5"
                              style={{ backgroundColor: catColor }}>
                              {prof.categoria.nombre}
                            </span>
                          </div>
                        </div>

                        {(prof.promedio_resenas ?? 0) > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < Math.round(prof.promedio_resenas ?? 0) ? 'text-amber-400 fill-current' : 'text-gray-200 fill-current'}`} />
                            ))}
                            <span className="text-[11px] font-semibold text-amber-600 ml-0.5">
                              {(prof.promedio_resenas ?? 0).toFixed(1)}
                            </span>
                          </div>
                        )}

                        {ub.direccion && (
                          <p className="text-[11px] text-gray-500 mb-3 flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                            {ub.direccion}{ub.ciudad ? `, ${ub.ciudad}` : ''}
                          </p>
                        )}

                        <Link
                          to={`/profesionales/${prof.id}`}
                          className="flex items-center justify-center gap-1.5 w-full text-[12px] font-bold text-white py-2 rounded-xl transition-colors"
                          style={{ backgroundColor: catColor }}
                        >
                          Ver perfil
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                );
              })
          )}
        </MapContainer>
      )}

      {/* ── Loading overlay ── */}
      {(!coords || isLoading) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm z-10 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
          </div>
          <p className="text-[14px] font-medium text-gray-600">
            {!coords ? 'Obteniendo tu ubicación...' : 'Buscando profesionales cercanos...'}
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {coords && !isLoading && !hasProfesionales && (
        <div className="absolute inset-0 flex items-end justify-center z-10 pb-32 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 mx-4 max-w-sm w-full pointer-events-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-gray-300" />
            </div>
            {hasFarProfesionales ? (
              <>
                <p className="font-bold text-gray-800 mb-1">No hay profesionales en {radio} km</p>
                <p className="text-[12px] text-gray-400 mb-4">
                  Hay {fallbackData?.meta.total} profesional(es) disponibles fuera de este radio.
                </p>
                <button
                  onClick={() => setRadio(100)}
                  className="px-5 py-2 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Ampliar a 100 km
                </button>
              </>
            ) : (
              <>
                <p className="font-bold text-gray-800 mb-1">Sin profesionales en el mapa</p>
                <p className="text-[12px] text-gray-400">
                  Los profesionales deben agregar su ubicación en su perfil para aparecer aquí.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Controles top ── */}
      <div className="absolute top-4 left-4 right-4 md:left-72 z-[1000] flex items-center gap-2 pointer-events-none">

        {/* Filtro de radio */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-1.5 pointer-events-auto">
          {RADIOS.map((r) => (
            <button
              key={r}
              onClick={() => setRadio(r)}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-xl transition-all duration-150 ${
                radio === r
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {r} km
            </button>
          ))}
        </div>

        {/* Botón mi ubicación */}
        <button
          onClick={getLocation}
          disabled={gettingLocation}
          className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 flex items-center justify-center pointer-events-auto hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Mi ubicación"
        >
          {gettingLocation
            ? <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-600" />
            : <Crosshair className="w-4.5 h-4.5 text-gray-600" />
          }
        </button>
      </div>

      {/* ── Badge de resultados ── */}
      {coords && !isLoading && hasProfesionales && (
        <div className="absolute bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-100 px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-[13px] font-semibold text-gray-700">
              <span className="text-indigo-600">{data?.meta.total ?? 0}</span> profesional{(data?.meta.total ?? 0) !== 1 ? 'es' : ''} en {radio} km
            </p>
          </div>
        </div>
      )}

      {/* ── Panel de visibilidad — solo profesionales ── */}
      {user?.rol === 'profesional' && misUbicaciones.length > 0 && (
        <div className="absolute bottom-6 right-4 z-[1000] w-72">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">

            {/* Header del panel */}
            <button
              onClick={() => setShowVisPanel((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${misUbicaciones.some(u => u.visible_en_mapa) ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-[13px] font-bold text-gray-800">Mi visibilidad en el mapa</span>
              </div>
              {showVisPanel
                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                : <ChevronUp className="w-4 h-4 text-gray-400" />
              }
            </button>

            {/* Lista de ubicaciones */}
            {showVisPanel && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {misUbicaciones.map((ub) => (
                  <div key={ub.id} className="flex items-center gap-3 px-4 py-3">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">{ub.direccion}</p>
                      <p className="text-[11px] text-gray-400">{ub.ciudad}</p>
                    </div>

                    {/* Toggle switch */}
                    <button
                      onClick={() => visMutation.mutate({ id: ub.id, visible: !ub.visible_en_mapa })}
                      disabled={visMutation.isPending}
                      className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${
                        ub.visible_en_mapa ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                      title={ub.visible_en_mapa ? 'Ocultar del mapa' : 'Mostrar en el mapa'}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                          ub.visible_en_mapa ? 'left-5' : 'left-1'
                        }`}
                      />
                    </button>

                    {/* Icono de estado */}
                    {ub.visible_en_mapa
                      ? <Eye className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      : <EyeOff className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    }
                  </div>
                ))}

                <div className="px-4 py-2.5 bg-gray-50">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Las ubicaciones ocultas no aparecen en el mapa público ni en búsquedas cercanas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
