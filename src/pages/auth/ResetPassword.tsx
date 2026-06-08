import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Eye, EyeOff, Loader2, CheckCircle, Lock } from 'lucide-react';
import { resetPassword } from '../../lib/auth';

const schema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres').max(255),
  confirm: z.string().min(1, 'Confirma la contraseña'),
}).refine((d) => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] });

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) { setError('Token inválido'); return; }
    setError('');
    try {
      await resetPassword(token, data.password);
      setDone(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Error al restablecer la contraseña');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 font-medium">Enlace inválido o expirado</p>
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
        </div>

        {done ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-700 font-medium mb-1">Contraseña actualizada</p>
            <p className="text-xs text-gray-500 mb-4">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <Link to="/login" className="text-sm text-blue-600 hover:underline font-medium">
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} {...register('password')}
                  className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input type={show ? 'text' : 'password'} {...register('confirm')}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirm ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Repite la contraseña" />
              {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {isSubmitting ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
