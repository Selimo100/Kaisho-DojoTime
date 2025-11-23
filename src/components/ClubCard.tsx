import { useNavigate } from 'react-router-dom';

interface ClubCardProps {
  name: string;
  city: string;
  slug: string;
}

export default function ClubCard({ name, city, slug }: ClubCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/club/${slug}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-left border border-gray-200 hover:border-blue-500"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{name}</h2>
      <p className="text-gray-600">{city}</p>
    </button>
  );
}
