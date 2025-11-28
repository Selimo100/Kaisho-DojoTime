import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-kaisho-whiteSoft flex flex-col items-center justify-center p-6">
      {/* 404 Illustration */}
      <div className="relative mb-8">
        <div className="text-[150px] md:text-[200px] font-black text-kaisho-greyLight/50 leading-none select-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-kaisho-blue to-kaisho-blueLight rounded-3xl flex items-center justify-center shadow-xl transform -rotate-12">
            <span className="text-5xl md:text-6xl">🥋</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <h1 className="text-3xl md:text-4xl font-bold text-kaisho-blue mb-3 text-center">
        Seite nicht gefunden
      </h1>
      <p className="text-gray-500 text-center max-w-md mb-8 text-lg">
        Ups! Die Seite, die Sie suchen, existiert nicht oder wurde verschoben.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-white border-2 border-kaisho-greyLight hover:border-kaisho-blueLight text-kaisho-blue font-semibold rounded-xl transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md"
        >
          ← Zurück
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-gradient-to-r from-kaisho-blue to-kaisho-blueLight hover:from-kaisho-blueLight hover:to-kaisho-blue text-white font-semibold rounded-xl transition-all duration-300 active:scale-95 shadow-lg"
        >
          🏠 Zur Startseite
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="mt-16 flex items-center gap-4 text-gray-400">
        <div className="w-12 h-px bg-kaisho-greyLight"></div>
        <span className="text-sm font-medium">Kaisho DojoTime</span>
        <div className="w-12 h-px bg-kaisho-greyLight"></div>
      </div>
    </div>
  );
}
