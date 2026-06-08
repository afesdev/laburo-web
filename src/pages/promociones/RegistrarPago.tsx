import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { getPromocion, registrarPago } from '../../lib/promociones';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function RegistrarPago() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();

  const [metodoPago, setMetodoPago] = useState(searchParams.get('metodo') || 'nequi');
  const [referencia, setReferencia] = useState(searchParams.get('ref') || '');
  const [notas, setNotas] = useState(searchParams.get('notas') || '');
  const [copied, setCopied] = useState(false);

  const { data: promo, isLoading } = useQuery({
    queryKey: ['promocion', id],
    queryFn: () => getPromocion(Number(id)),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: () =>
      registrarPago(Number(id), {
        monto: promo!.plan.precio,
        metodo_pago: metodoPago,
        referencia_externa: referencia,
        notas,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mis-promociones'] });
      qc.invalidateQueries({ queryKey: ['promocion', id] });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-[16px] font-bold text-gray-700 mb-1">Promoción no encontrada</p>
        <button onClick={() => navigate('/promociones')} className="text-[13px] text-indigo-600 font-semibold mt-2">
          Volver a mis promociones
        </button>
      </div>
    );
  }

  const TIPO_LABEL: Record<string, string> = {
    banner: 'Banner',
    perfil: 'Perfil destacado',
    publicacion: 'Publicación',
  };

  const success = mutation.isSuccess;

  return (
    <div className="max-w-lg mx-auto pb-10">
      <button
        onClick={() => navigate('/promociones')}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-700 mb-3 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver
      </button>

      <h1 className="text-[22px] font-black text-gray-900 mb-6">
        {success ? '¡Pago registrado!' : 'Registrar pago'}
      </h1>

      {success ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-[16px] font-bold text-gray-900 mb-1">Pago enviado para revisión</p>
          <p className="text-[13px] text-gray-500 mb-6">
            Recibirás una notificación cuando el administrador apruebe tu promoción.
          </p>
          <button
            onClick={() => navigate('/promociones')}
            className="px-6 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Ver mis promociones
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-gray-400 uppercase tracking-wide font-semibold">{TIPO_LABEL[promo.tipo]}</p>
              <span className="text-[11px] font-semibold text-gray-400">
                Plan {promo.plan.nombre}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-[14px] text-gray-600">Total a pagar</p>
              <p className="text-[24px] font-black text-gray-900">{formatCOP(promo.plan.precio)}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
            <p className="text-[13px] font-bold text-gray-700">Datos bancarios</p>
            <div className="space-y-2">
              {[
                { label: 'Nequi', value: '300 123 4567' },
                { label: 'Bancolombia', value: '000-123456-78' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                  <div>
                    <p className="text-[12px] text-gray-400">{label}</p>
                    <p className="text-[14px] font-bold text-gray-900">{value}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">Titular: App Profesionales S.A.S</p>
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
              <option value="pse">PSE</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Número de referencia / comprobante *
            </label>
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ingresa el número de la transacción"
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
            onClick={() => mutation.mutate()}
            disabled={!referencia.trim() || mutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-[14px] font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              `Confirmar pago · ${formatCOP(promo.plan.precio)}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
