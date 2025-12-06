import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getClubs } from "../lib/supabaseService";
import type { Club } from "../types";

export default function HomePage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const data = await getClubs();
        setClubs(data);
      } catch (error) {
        console.error("Error fetching clubs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const openWebsite = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    url: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openInMaps = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    address?: string,
    name?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const query = encodeURIComponent(address || name || "");
    if (!query) return;

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-kaisho-whiteSoft">
      {/* Hero Section mit Logo */}
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12 md:mb-16">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img
              src="/kaisho-logo.png"
              alt="Kaisho DojoTime Logo"
              className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl"
            />
          </div>

          {/* Titel */}
          <h1 className="text-4xl md:text-6xl font-bold text-kaisho-blue mb-4 drop-shadow-sm">
            KAISHO-DOJOTIME
          </h1>
          <p className="text-lg md:text-2xl text-kaisho-blue/70 font-light">
            Trainingsplaner für die Kaisho Karate Association
          </p>
        </div>

        {/* Vereinsauswahl */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-kaisho-blue text-center mb-8 md:mb-12">
            Wählen Sie Ihren Verein
          </h2>

          {isLoading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-kaisho-blue border-t-transparent"></div>
              <p className="text-kaisho-blue/70 mt-4">Lade Vereine...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {clubs.map((club) => (
                <Link
                  key={club.id}
                  to={`/club/${club.slug}`}
                  className="group relative bg-white rounded-2xl p-6 md:p-8 
                           hover:bg-kaisho-blueIce transition-all duration-300 transform hover:scale-[1.02]
                           border border-kaisho-greyLight hover:border-kaisho-blueLight
                           shadow-md hover:shadow-xl"
                >
                  {/* Club Card Content */}
                  <div className="flex flex-col h-full">
                    {/* Icon / Anfangsbuchstabe */}
                    <div className="text-center mb-4">
                      <div
                        className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-kaisho-blue to-kaisho-blueLight rounded-full 
                                    flex items-center justify-center text-white text-2xl md:text-3xl font-bold
                                    group-hover:scale-110 transition-transform duration-300 shadow-lg"
                      >
                        {club.name.charAt(0)}
                      </div>
                    </div>

                    {/* Name und Stadt */}
                    <div className="text-center mb-3">
                      <h3 className="text-xl md:text-2xl font-bold text-kaisho-blue mb-1 group-hover:text-kaisho-blueLight transition-colors">
                        {club.name}
                      </h3>
                    </div>

                    {/* Adresse */}
                    {club.address && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 text-center line-clamp-3">
                          <span className="mr-1" aria-hidden="true">
                            📍
                          </span>
                          {club.address}
                        </p>
                      </div>
                    )}

                    {/* Buttons: Website & Google Maps */}
                    <div className="mt-auto pt-3 flex flex-wrap justify-center gap-2">
                      {club.website_url && (
                        <button
                          type="button"
                          onClick={(e) => openWebsite(e, club.website_url!)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium 
                                     rounded-full border border-kaisho-blueLight 
                                     text-kaisho-blue bg-white hover:bg-kaisho-blueLight/10
                                     transition-colors"
                        >
                          <span>Website öffnen</span>
                        </button>
                      )}

                      {(club.address || club.name) && (
                        <button
                          type="button"
                          onClick={(e) =>
                            openInMaps(e, club.address, club.name)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium 
                                     rounded-full border border-kaisho-blueLight 
                                     text-kaisho-blue bg-white hover:bg-kaisho-blueLight/10
                                     transition-colors"
                        >
                          <span>In Google Maps</span>
                        </button>
                      )}
                    </div>

                    {/* Pfeil nach rechts */}
                    <div className="mt-4 flex justify-center">
                      <svg
                        className="w-6 h-6 text-gray-400 group-hover:text-kaisho-blueLight group-hover:translate-x-2 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>

                    {/* Hover Effekt Overlay */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r 
                                  from-kaisho-blueLight/0 via-kaisho-blueLight/5 to-kaisho-blueLight/0 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    ></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-16 md:mt-24 mb-4 ">
          <footer className="border-t border-kaisho-greyLight pt-8 md:pt-10">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-gray-500 text-xs md:text-sm px-4">
              {/* Links */}
              <div className="text-center md:text-left space-y-2">
                <a
                  href="https://kaisho.ch/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:text-kaisho-blue transition-colors underline underline-offset-4"
                >
                  Mehr über Kaisho Karate Association
                </a>
              </div>

              {/* Built by */}
              <div className="flex flex-col items-center md:items-end gap-2">
                <p className="tracking-wide">
                  built by{" "}
                  <span className="font-semibold text-kaisho-blue">
                    Selina Mogicato
                  </span>
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
