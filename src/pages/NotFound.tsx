import { Link } from 'react-router-dom';
import errorSvg from '../assets/error-404.svg';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <img src={errorSvg} alt="Página no encontrada" className="w-96 h-96 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
        <p className="text-gray-500 mb-6">La ruta que buscas no existe o fue movida.</p>
        <Link
          to="/feed"
          className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
