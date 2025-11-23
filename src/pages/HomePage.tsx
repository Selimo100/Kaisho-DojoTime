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

  return (
    <div className="min-h-screen bg-gradient-to-br from-kaisho-dark via-kaisho-primary to-kaisho-secondary">
      {/* Hero Section with Logo */}
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

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            KAISHO-DOJOTIME
          </h1>
          <p className="text-lg md:text-2xl text-kaisho-light/90 font-light">
            Trainingsplaner für die Kaisho Karate Association
          </p>
        </div>

        {/* Club Selection */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 md:mb-12">
            Wählen Sie Ihren Verein
          </h2>

          {isLoading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
              <p className="text-white mt-4">Lade Vereine...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {clubs.map((club) => (
                <Link
                  key={club.id}
                  to={`/club/${club.slug}`}
                  className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 
                           hover:bg-white/20 transition-all duration-300 transform hover:scale-105 
                           border-2 border-white/20 hover:border-kaisho-accent
                           shadow-xl hover:shadow-2xl"
                >
                  {/* Club Card Content */}
                  <div className="text-center">
                    <div className="mb-4">
                      <div
                        className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-kaisho-accent rounded-full 
                                    flex items-center justify-center text-white text-2xl md:text-3xl font-bold
                                    group-hover:scale-110 transition-transform duration-300"
                      >
                        {club.name.charAt(0)}
                      </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-kaisho-accent transition-colors">
                      {club.name}
                    </h3>
                    <p className="text-sm md:text-base text-kaisho-light/80">
                      Karate Dojo
                    </p>

                    {/* Arrow Icon */}
                    <div className="mt-4 flex justify-center">
                      <svg
                        className="w-6 h-6 text-white/60 group-hover:text-kaisho-accent group-hover:translate-x-2 transition-all"
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
                  </div>

                  {/* Hover Effect Border */}
                  <div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-kaisho-accent/0 via-kaisho-accent/10 to-kaisho-accent/0 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  ></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      {/* Footer Info */}
      <div className="mt-16 md:mt-24 mb-4 ">
        <footer className="border-t border-white/10 pt-8 md:pt-10">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-kaisho-light/70 text-xs md:text-sm px-4">
            {/* Links */}
            <div className="text-center md:text-left space-y-2">
              <a
                href="https://kaisho.ch/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block hover:text-white transition-colors underline underline-offset-4"
              >
                Mehr über Kaisho Karate Association
              </a>
            </div>

            {/* Built by + Kontakt */}
            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="tracking-wide">
                built by{" "}
                <span className="font-semibold text-white">
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
