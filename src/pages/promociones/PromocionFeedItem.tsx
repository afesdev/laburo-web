import { useNavigate } from 'react-router-dom';
import { Zap, Eye, MapPin } from 'lucide-react';
import { registrarClic } from '../../lib/promociones';
import type { Promocion } from '../../types/promocion';

// ── Tarjeta de perfil patrocinado (scroll horizontal) ─────────────────────────
export function PromocionPerfilCard({ promo }: { promo: Promocion }) {
  const navigate = useNavigate();
  const prof = promo.profesional;

  const handleClick = () => {
    if (!prof?.id) return;
    registrarClic(promo.id).catch(() => {});
    navigate(`/profesionales/${prof.id}`);
  };

  const initials =
    prof?.usuario?.nombre_completo
      ?.split(' ')
      .slice(0, 2)
      .map((n: string) => n[0])
      .join('') ?? '?';

  const catNombre = prof?.categoria?.nombre ?? '';

  return (
    <button
      onClick={handleClick}
      className="group w-[140px] text-left"
    >
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200">

        {/* Foto superior */}
        <div className="h-[90px] w-full relative overflow-hidden bg-indigo-50">
          {prof?.foto_perfil_url ? (
            <img
              src={prof.foto_perfil_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-100">
              <span className="text-3xl font-black text-indigo-300">{initials}</span>
            </div>
          )}
          {/* Badge patrocinado */}
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-indigo-600 text-[9px] font-bold border border-indigo-100">
              <Zap className="w-2.5 h-2.5" />
              Dest.
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-1.5">
          <p className="text-[12px] font-bold text-gray-900 truncate leading-tight">
            {prof?.usuario?.nombre_completo ?? 'Profesional'}
          </p>
          {catNombre && (
            <p className="text-[10px] font-semibold truncate" style={{ color: '#4F46E5' }}>
              {catNombre}
            </p>
          )}
          {prof?.ciudad && (
            <p className="flex items-center gap-1 text-[10px] text-gray-400 truncate">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              {prof.ciudad}
            </p>
          )}

          {/* CTA */}
          <div className="pt-1.5">
            <div className="w-full py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-center text-[10px] font-bold text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              Ver perfil
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Tarjeta de publicación patrocinada (scroll horizontal) ────────────────────
export function PromocionPublicacionCard({ promo }: { promo: Promocion }) {
  const navigate = useNavigate();
  const pub  = promo.promo_publicacion?.publicacion;
  const prof = promo.profesional;

  const handleClick = () => {
    if (pub?.id) {
      registrarClic(promo.id).catch(() => {});
      navigate(`/publicaciones/${pub.id}`);
    } else if (prof?.id) {
      registrarClic(promo.id).catch(() => {});
      navigate(`/profesionales/${prof.id}`);
    }
  };

  if (!pub && !prof) return null;

  const profInitials =
    prof?.usuario?.nombre_completo
      ?.split(' ')
      .slice(0, 2)
      .map((n: string) => n[0])
      .join('') ?? '?';

  return (
    <button
      onClick={handleClick}
      className="group w-[200px] text-left"
    >
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200">

        {/* Imagen publicación */}
        <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
          {pub?.imagen_url ? (
            <img
              src={pub.imagen_url}
              alt={pub.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50">
              <Eye className="w-7 h-7 text-indigo-200" />
            </div>
          )}
          {/* Badge */}
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-indigo-600 text-[9px] font-bold shadow-sm border border-indigo-100">
              <Zap className="w-2.5 h-2.5" />
              Patrocinado
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          {pub?.titulo && (
            <p className="text-[12px] font-bold text-gray-900 leading-tight line-clamp-2">
              {pub.titulo}
            </p>
          )}

          {/* Profesional row */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-gray-200">
              {prof?.foto_perfil_url ? (
                <img src={prof.foto_perfil_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[6px] font-black">
                  {profInitials}
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-500 font-medium truncate">
              {prof?.usuario?.nombre_completo}
            </span>
          </div>

          {/* CTA */}
          <div className="pt-0.5">
            <div className="w-full py-1.5 rounded-lg border border-indigo-200 text-center text-[10px] font-bold text-indigo-600 group-hover:bg-indigo-50 transition-colors">
              Ver publicación →
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
