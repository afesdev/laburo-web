import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { registrarClic } from '../../lib/promociones';
import type { Promocion } from '../../types/promocion';

export default function CarruselBanners({ banners }: { banners: Promocion[] }) {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % banners.length),
    [banners.length],
  );

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [banners.length, next]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  const handleClick = () => {
    if (!banner) return;
    registrarClic(banner.id).catch(() => {});
    if (banner.profesional?.id) navigate(`/profesionales/${banner.profesional.id}`);
  };

  return (
    <section className="mb-8">

      {/* Cabecera sección */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
            <Tag className="w-4 h-4 text-green-600" />
          </div>
          <h2 className="text-[18px] font-black text-gray-900">Ofertas y promociones</h2>
          {banners.length > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
              {banners.length}
            </span>
          )}
        </div>
        {banners.length > 1 && (
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Banner Card */}
      <button onClick={handleClick} className="w-full text-left group block">
        <div
          className="relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-0.5"
          style={{ height: 'clamp(200px, 32vw, 280px)' }}
        >
          {/* Imagen */}
          {banner.banner?.imagen_url ? (
            <img
              src={banner.banner.imagen_url}
              alt={banner.banner?.titulo ?? 'Promoción'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700" />
          )}

          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Badge patrocinado */}
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold">
              ⚡ Patrocinado
            </span>
          </div>

          {/* Contenido inferior */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {/* Categoría pill */}
            {banner.profesional?.categoria?.nombre && (
              <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold mb-3">
                {banner.profesional.categoria.nombre}
              </span>
            )}

            {banner.banner?.titulo && (
              <h3 className="text-white text-[20px] md:text-[24px] font-black leading-tight mb-1.5">
                {banner.banner.titulo}
              </h3>
            )}

            <div className="flex items-center justify-between">
              {/* Profesional info */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/60 flex-shrink-0">
                  {banner.profesional?.foto_perfil_url ? (
                    <img src={banner.profesional.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/20 text-white text-[11px] font-bold">
                      {banner.profesional?.usuario?.nombre_completo?.split(' ').slice(0, 2).map((n: string) => n[0]).join('') ?? '?'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white text-[13px] font-bold leading-none">
                    {banner.profesional?.usuario?.nombre_completo}
                  </p>
                  {banner.banner?.descripcion && (
                    <p className="text-white/70 text-[11px] mt-0.5 line-clamp-1">{banner.banner.descripcion}</p>
                  )}
                </div>
              </div>

              {/* CTA */}
              <span className="flex-shrink-0 px-4 py-2 bg-white text-indigo-700 text-[12px] font-black rounded-xl shadow-sm">
                Ver perfil →
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Indicadores */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-indigo-500' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
