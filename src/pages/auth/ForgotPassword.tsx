import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPassword } from '../../lib/auth';

const schema = z.object({
  email: z.string().email('Correo inválido'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Error al enviar el correo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">Te enviaremos un enlace para restablecerla</p>
        </div>

        {sent ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-700 font-medium mb-1">Correo enviado</p>
            <p className="text-xs text-gray-500 mb-4">Si el correo está registrado, recibirás un enlace de recuperación.</p>
            <Link to="/login" className="text-sm text-blue-600 hover:underline font-medium">
              Volver a inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input type="email" {...register('email')}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="correo@ejemplo.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
            </button>
            <Link to="/login" className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-blue-600">
              <ArrowLeft className="w-3 h-3" /> Volver a inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
