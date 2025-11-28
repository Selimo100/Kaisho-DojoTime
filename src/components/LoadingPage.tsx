export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-kaisho-whiteSoft flex flex-col items-center justify-center p-6">
      {/* Logo / Brand */}
      <div className="mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-kaisho-blue to-kaisho-blueLight rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-4xl">🥋</span>
        </div>
      </div>

      {/* Loading Spinner */}
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-kaisho-greyLight rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-kaisho-blue rounded-full border-t-transparent animate-spin"></div>
      </div>

      {/* Loading Text */}
      <h2 className="text-xl font-bold text-kaisho-blue mb-2">
        Laden...
      </h2>
      <p className="text-gray-500 text-sm">
        Bitte warten Sie einen Moment
      </p>

      {/* Animated Dots */}
      <div className="flex gap-1.5 mt-6">
        <div className="w-2.5 h-2.5 bg-kaisho-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2.5 h-2.5 bg-kaisho-blueLight rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2.5 h-2.5 bg-kaisho-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
