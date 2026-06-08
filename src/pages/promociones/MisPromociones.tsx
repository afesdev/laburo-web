import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, XCircle, Loader2, TrendingUp,
  MousePointerClick, Calendar,
} from 'lucide-react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMisPromociones, cancelarPromocion } from '../../lib/promociones';
import type { Promocion } from '../../types/promocion';

const ESTADO_CONFIG: Record<string, { label: string; bg: string }> = {
  pendiente_pago: { label: 'Pendiente de pago', bg: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  pendiente_aprobacion: { label: 'En revisión', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
  activa: { label: 'Activa', bg: 'bg-green-100 text-green-700 border-green-200' },
  rechazada: { label: 'Rechazada', bg: 'bg-red-100 text-red-700 border-red-200' },
  cancelada: { label: 'Cancelada', bg: 'bg-gray-100 text-gray-600 border-gray-200' },
  finalizada: { label: 'Finalizada', bg: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const TIPO_LABEL: Record<string, string> = {
  banner: 'Banner',
  perfil: 'Perfil destacado',
  publicacion: 'Publicación',
};

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

function PromocionCard({ promo, onCancel }: { promo: Promocion; onCancel: (id: number) => void }) {
  const cfg = ESTADO_CONFIG[promo.estado] ?? { label: promo.estado, bg: 'bg-gray-100 text-gray-600' };
  const [confirming, setConfirming] = useState(false);

  const diasRestantes = promo.fecha_fin
    ? differenceInDays(new Date(promo.fecha_fin), new Date())
    : null;
  const horasRestantes = promo.fecha_fin
    ? differenceInHours(new Date(promo.fecha_fin), new Date())
    : null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg}`}>
                {cfg.label}
              </span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                {TIPO_LABEL[promo.tipo] ?? promo.tipo}
              </span>
            </div>
            <p className="text-[15px] font-bold text-gray-900 mt-1">
              Plan {promo.plan.nombre}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <MousePointerClick className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <p className="text-[18px] font-bold text-gray-900">{promo.clics}</p>
            <p className="text-[10px] font-medium text-gray-400">Clics</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <TrendingUp className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <p className="text-[18px] font-bold text-gray-900">{promo.impresiones}</p>
            <p className="text-[10px] font-medium text-gray-400">Vistas</p>
          </div>
        </div>

        <div className="space-y-1.5 text-[12px] text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {promo.fecha_inicio ? (
              <span>Creada {format(new Date(promo.created_at ?? promo.fecha_inicio), "d 'de' MMM", { locale: es })}</span>
            ) : (
              <span>Creada {format(new Date(promo.created_at!), "d 'de' MMM", { locale: es })}</span>
            )}
          </div>
          {promo.estado === 'activa' && diasRestantes !== null && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className={diasRestantes <= 1 ? 'text-red-500 font-semibold' : ''}>
                {diasRestantes > 0
                  ? `Restan ${diasRestantes}d ${horasRestantes! % 24}h`
                  : 'Vence hoy'}
              </span>
            </div>
          )}
          {promo.pagos?.[0] && (
            <p className="font-semibold text-gray-700">
              Pagado: {formatCOP(promo.pagos[0].monto)} ·{' '}
              <span className="capitalize">{promo.pagos[0].metodo_pago}</span>
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {promo.estado === 'pendiente_pago' && (
            <button
              onClick={() => window.location.href = `/promociones/${promo.id}/pagar`}
              className="flex-1 px-3 py-2 bg-indigo-600 text-white text-[12px] font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Registrar pago
            </button>
          )}
          {(promo.estado === 'pendiente_pago' || promo.estado === 'pendiente_aprobacion') && (
            confirming ? (
              <div className="flex gap-1 flex-1">
                <button
                  onClick={() => { onCancel(promo.id); setConfirming(false); }}
                  className="flex-1 px-3 py-2 bg-red-600 text-white text-[12px] font-bold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 px-3 py-2 border border-gray-200 text-gray-600 text-[12px] font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-[12px] font-semibold rounded-xl hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancelar
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function MisPromociones() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['mis-promociones'],
    queryFn: getMisPromociones,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelarPromocion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mis-promociones'] }),
  });

  const activas = promos.filter((p) => p.estado === 'activa');
  const pendientes = promos.filter((p) => p.estado === 'pendiente_pago' || p.estado === 'pendiente_aprobacion');
  const historial = promos.filter((p) => ['rechazada', 'cancelada', 'finalizada'].includes(p.estado));

  const renderSection = (title: string, items: Promocion[], emptyMsg: string) => (
    <section>
      <h2 className="text-[16px] font-bold text-gray-900 mb-3">{title}</h2>
      {items.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-8 text-center">
          <p className="text-[13px] text-gray-400">{emptyMsg}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <PromocionCard key={p.id} promo={p} onCancel={(id) => cancelMutation.mutate(id)} />
          ))}
        </div>
      )}
    </section>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-gray-900">Mis Promociones</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {activas.length > 0
              ? `${activas.length} promoción(es) activa(s)`
              : 'Aún no tienes promociones activas'}
          </p>
        </div>
        <button
          onClick={() => navigate('/promociones/crear')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </button>
      </div>

      {promos.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="text-[16px] font-bold text-gray-700 mb-1">Sin promociones</p>
          <p className="text-[13px] text-gray-400 mb-6">
            Destaca tu perfil, crea un banner o promociona una publicación
          </p>
          <button
            onClick={() => navigate('/promociones/crear')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear primera promoción
          </button>
        </div>
      ) : (
        <>
          {renderSection('Activas', activas, 'No hay promociones activas')}
          {renderSection('Pendientes', pendientes, 'Sin promociones pendientes')}
          {historial.length > 0 && renderSection('Historial', historial, '')}
        </>
      )}
    </div>
  );
}
