import { useNavigate } from 'react-router-dom';

interface ClubCardProps {
  name: string;
  city: string;
  slug: string;
  address?: string;
  website_url?: string;
}

export default function ClubCard({ name, city, slug, address, website_url }: ClubCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/club/${slug}`);
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (website_url) {
      window.open(website_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-left border-2 border-kaisho-greyLight hover:border-kaisho-blueLight group relative overflow-hidden"
    >
      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-kaisho-blueIce/0 to-kaisho-blueLight/0 group-hover:from-kaisho-blueIce/30 group-hover:to-kaisho-blueLight/10 transition-all duration-300 rounded-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-kaisho-blue mb-1 group-hover:text-kaisho-blueLight transition-colors">
              {name}
            </h2>
            <p className="text-sm md:text-base text-gray-600 font-medium flex items-center gap-2">
              <span>📍</span>
              {city}
            </p>
          </div>
          
          {/* Arrow Icon */}
          <div className="w-10 h-10 rounded-xl bg-kaisho-blueIce group-hover:bg-kaisho-blueLight flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <span className="text-kaisho-blue group-hover:text-white text-xl font-bold">→</span>
          </div>
        </div>

        {/* Address */}
        {address && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-base">🏢</span>
              <span>{address}</span>
            </p>
          </div>
        )}

        {/* Website Link */}
        {website_url && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleWebsiteClick}
              className="inline-flex items-center gap-2 px-3 py-2 bg-kaisho-blueIce hover:bg-kaisho-blueLight text-kaisho-blue hover:text-white text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95"
            >
              <span>🌐</span>
              <span>Website</span>
            </button>
          </div>
        )}
      </div>
    </button>
  );
}
