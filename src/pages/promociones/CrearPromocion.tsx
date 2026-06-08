import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Image, User, FileText, ChevronLeft, ChevronRight,
  Loader2, Upload, Check, Info,
} from 'lucide-react';
import { getPlanes, crearPromocion, subirImagenBanner } from '../../lib/promociones';
import { useAuth } from '../../store/auth';
import type { PlanPromocion, TipoPromocion } from '../../types/promocion';

const TIPOS: { value: TipoPromocion; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'banner', label: 'Banner', desc: 'Imagen destacada en la pantalla de inicio', icon: Image },
  { value: 'perfil', label: 'Perfil destacado', desc: 'Tu perfil aparece al inicio como destacado', icon: User },
  { value: 'publicacion', label: 'Publicación', desc: 'Una publicación tuya aparece promocionada en el feed', icon: FileText },
];

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function CrearPromocion() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [tipo, setTipo] = useState<TipoPromocion | null>(null);
  const [planId, setPlanId] = useState<number | null>(null);
  const [imagenUrl, setImagenUrl] = useState('');
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');
  const [publicacionId, setPublicacionId] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState('nequi');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');

  const { data: planes = [] } = useQuery({
    queryKey: ['planes-promocion'],
    queryFn: getPlanes,
  });

  const { data: pubsData } = useQuery({
    queryKey: ['my-publications-select'],
    queryFn: () =>
      import('../../lib/publicaciones').then((m) =>
        m.fetchPublicaciones({ profesional_id: (user as any)?.profesional_id, limit: 100 }),
      ),
    enabled: tipo === 'publicacion' && !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof crearPromocion>[0]) => crearPromocion(data),
    onSuccess: (promo) => {
      navigate(`/promociones/${promo.id}/pagar?metodo=${metodoPago}&ref=${encodeURIComponent(referencia)}&notas=${encodeURIComponent(notas)}`);
    },
  });

  const planSeleccionado = planes.find((p) => p.id === planId);
  const publicaciones = (pubsData as any)?.data ?? [];

  const handleUpload = async () => {
    if (!imagenFile) return;
    setUploading(true);
    try {
      const result = await subirImagenBanner(imagenFile);
      setImagenUrl(result.url);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!tipo || !planId) return;
    const payload: any = { tipo, plan_id: planId };

    if (tipo === 'banner') {
      payload.imagen_url = imagenUrl;
      if (titulo) payload.titulo = titulo;
      if (descripcion) payload.descripcion = descripcion;
    }
    if (tipo === 'perfil' && mensajePersonalizado) {
      payload.mensaje_personalizado = mensajePersonalizado;
    }
    if (tipo === 'publicacion' && publicacionId) {
      payload.publicacion_id = publicacionId;
    }

    createMutation.mutate(payload);
  };

  const canNext = () => {
    if (step === 0) return tipo !== null;
    if (step === 1) return planId !== null;
    if (step === 2) {
      if (tipo === 'banner') return !!imagenUrl;
      if (tipo === 'publicacion') return publicacionId !== null;
      return true;
    }
    if (step === 3) return !!referencia.trim();
    return true;
  };

  const steps = ['Tipo', 'Plan', 'Detalle', 'Pago'];

  return (
    <div className="max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : navigate('/promociones'))}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 0 ? 'Volver' : 'Atrás'}
        </button>
        <h1 className="text-[22px] font-black text-gray-900">Nueva promoción</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Paso {step + 1} de 4</p>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-1.5 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full h-1 rounded-full transition-colors ${
                i < step ? 'bg-indigo-600' : i === step ? 'bg-indigo-400' : 'bg-gray-100'
              }`}
            />
            <span className={`text-[10px] font-semibold ${i <= step ? 'text-indigo-600' : 'text-gray-300'}`}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Step 0: Tipo */}
      {step === 0 && (
        <div className="space-y-3">
          {TIPOS.map((t) => {
            const Icon = t.icon;
            const selected = tipo === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-gray-900">{t.label}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{t.desc}</p>
                </div>
                {selected && <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Step 1: Plan */}
      {step === 1 && (
        <div className="space-y-3">
          {planes
            .sort((a, b) => a.posicion_preferente - b.posicion_preferente)
            .map((plan) => {
              const selected = planId === plan.id;
              const isPremium = plan.nombre === 'Premium';
              return (
                <button
                  key={plan.id}
                  onClick={() => setPlanId(plan.id)}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  } ${isPremium ? 'relative' : ''}`}
                >
                  {isPremium && (
                    <span className="absolute -top-2.5 right-4 px-3 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                      Recomendado
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[16px] font-bold text-gray-900">{plan.nombre}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">{plan.duracion_dias} días de duración</p>
                    </div>
                    <p className="text-[18px] font-black text-indigo-600">{formatCOP(plan.precio)}</p>
                  </div>
                </button>
              );
            })}
        </div>
      )}

      {/* Step 2: Detalle */}
      {step === 2 && (
        <div className="space-y-4">
          {tipo === 'banner' && (
            <>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Imagen del banner *</label>
                {imagenUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={imagenUrl} alt="" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => { setImagenUrl(''); setImagenFile(null); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-lg flex items-center justify-center text-sm hover:bg-black/70"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-300 mb-1" />
                        <p className="text-[12px] text-gray-400">Toca para subir imagen</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { setImagenFile(file); handleUpload(); }
                      }}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Título <span className="text-gray-400">(opcional, máx. 60)</span>
                </label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value.slice(0, 60))}
                  placeholder="Ej: Ofertas de julio"
                  className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-[14px] focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">{titulo.length}/60</p>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Descripción <span className="text-gray-400">(opcional, máx. 120)</span>
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value.slice(0, 120))}
                  placeholder="Ej: Aprovecha mis servicios profesionales..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-[14px] focus:outline-none focus:border-indigo-400 focus:bg-white resize-none transition-all"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">{descripcion.length}/120</p>
              </div>
            </>
          )}

          {tipo === 'perfil' && (
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Mensaje personalizado <span className="text-gray-400">(opcional, máx. 100)</span>
              </label>
              <textarea
                value={mensajePersonalizado}
                onChange={(e) => setMensajePersonalizado(e.target.value.slice(0, 100))}
                placeholder="Ej: Confiable y con experiencia comprobable"
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-[14px] focus:outline-none focus:border-indigo-400 focus:bg-white resize-none transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1 text-right">{mensajePersonalizado.length}/100</p>
              <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-xl">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-blue-700">Tu perfil aparecerá como destacado en la pantalla principal con este mensaje.</p>
              </div>
            </div>
          )}

          {tipo === 'publicacion' && (
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Selecciona una publicación *</label>
              {publicaciones.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-[13px] text-gray-400 mb-2">No tienes publicaciones</p>
                  <button
                    onClick={() => navigate('/publicaciones/crear')}
                    className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Crear una publicación primero
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {publicaciones.map((pub: any) => (
                    <button
                      key={pub.id}
                      onClick={() => setPublicacionId(pub.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        publicacionId === pub.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      {pub.imagen_url ? (
                        <img src={pub.imagen_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{pub.titulo}</p>
                        <p className="text-[11px] text-gray-400 truncate">{pub.descripcion}</p>
                      </div>
                      {publicacionId === pub.id && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Pago */}
      {step === 3 && planSeleccionado && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white">
            <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wide mb-1">Resumen</p>
            <p className="text-[20px] font-black">{planSeleccionado.nombre}</p>
            <p className="text-[13px] text-white/80 mt-1">{planSeleccionado.duracion_dias} días · {formatCOP(planSeleccionado.precio)}</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
            <p className="text-[13px] font-bold text-gray-700">Datos bancarios</p>
            <div className="text-[12px] text-gray-600 space-y-1">
              <p><span className="font-semibold">Nequi:</span> 300 123 4567</p>
              <p><span className="font-semibold">Bancolombia:</span> 000-123456-78</p>
              <p className="text-[11px] text-gray-400">Titular: App Profesionales S.A.S</p>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Método de pago</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-[14px] focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            >
              <option value="nequi">Nequi</option>
              <option value="transferencia">Transferencia bancaria</option>
              <option value="efectivo">Efectivo</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Número de referencia/comprobante *
            </label>
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: 1234567890"
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-[14px] focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Notas <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Alguna observación para el administrador..."
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-[14px] focus:outline-none focus:border-indigo-400 focus:bg-white resize-none transition-all"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canNext() || createMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-[14px] font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Crear y enviar para revisión'
            )}
          </button>
        </div>
      )}

      {/* Navigation */}
      {step < 3 && (
        <div className="mt-8">
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-[14px] font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Continuar
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
