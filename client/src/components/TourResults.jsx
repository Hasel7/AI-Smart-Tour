import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";

const TourResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchDestination = location.state?.destination || "";
  
  // Get user's saved preferred language
  const user = JSON.parse(sessionStorage.getItem("user") || '{}');
  const userLang = user.preferred_language || "English";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tour, setTour] = useState(null);

  useEffect(() => {
    if (!searchDestination) {
      navigate("/dashboard");
      return;
    }

    const generateTour = async () => {
      try {
        setLoading(true);
        // Call the new backend AI route
        const res = await api.post("/tours/generate", {
          destination: searchDestination,
          days: 3,
          language: userLang
        });
        
        setTour(res.data.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to generate your tour. Our AI might be taking a break!");
      } finally {
        setLoading(false);
      }
    };

    generateTour();
  }, [searchDestination, navigate]);

  // Helper to pick an emoji based on activity type
  const getTypeEmoji = (type) => {
    switch (type?.toUpperCase()) {
      case "CULTURE": return "🏛️";
      case "DINING": return "🍽️";
      case "NATURE": return "🌳";
      case "HOTELS": return "🏨";
      default: return "📍";
    }
  };

  // Helper to translate the word "Day" 
  const getTranslatedDayWord = (lang) => {
    const l = lang?.toLowerCase() || "";
    if (l === "fr" || l === "french") return "Jour";
    if (l === "es" || l === "spanish") return "Día";
    if (l === "de" || l === "german") return "Tag";
    if (l === "it" || l === "italian") return "Giorno";
    if (l === "pt" || l === "portuguese") return "Dia";
    if (l === "jp" || l === "japanese") return "日目"; // e.g. 1日目
    return "Day";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f1] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-6 animate-bounce">🪄</div>
        <h2 className="font-['Playfair_Display',serif] text-3xl font-bold text-[#2f2722] mb-3">
          Crafting your journey...
        </h2>
        <p className="text-[#a0978c] max-w-[250px]">
          Our AI is exploring the best hidden gems and vibrant spots in {searchDestination}.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf8f1] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-[#2f2722] mb-2">Oops!</h2>
        <p className="text-[#c85a3c] mb-6">{error}</p>
        <button 
          onClick={() => navigate("/dashboard")}
          className="bg-[#2f2722] text-white px-6 py-3 rounded-2xl font-semibold"
        >
          Try a different destination
        </button>
      </div>
    );
  }

  if (!tour) return null;

  return (
    <div className="min-h-screen bg-[#faf8f1] text-[#2f2722] font-['Inter',sans-serif] pb-24">
      {/* Header Area */}
      <div className="bg-[#2f2722] text-white pt-12 pb-10 rounded-b-[2.5rem] px-6 relative shadow-lg">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-6 hover:bg-white/20 transition backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="flex items-center space-x-2 text-[#dcb35f] text-xs font-bold tracking-widest uppercase mb-2">
          <span>✨</span>
          <span>AI Smart Itinerary</span>
        </div>
        
        <h1 className="font-['Playfair_Display',serif] text-[2.5rem] font-bold leading-tight mb-2">
          {tour.title}
        </h1>
        <div className="flex items-center text-[#a0978c] space-x-3 text-sm font-medium">
          <span className="flex items-center"><span className="mr-1">📍</span> {tour.destination}</span>
          <span>•</span>
          <span className="flex items-center"><span className="mr-1">💰</span> {tour.budget_estimate}</span>
        </div>
      </div>

      {/* Itinerary Timeline */}
      <div className="px-6 -mt-4 relative z-10 space-y-8">
        {tour.days?.map((day, dIdx) => (
          <div key={dIdx} className="bg-white rounded-3xl p-6 shadow-sm border border-[#f0ece1]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-[#2f2722] bg-[#f0ece1] px-4 py-1.5 rounded-full inline-block">
                {(userLang?.toLowerCase() === "japanese" || userLang?.toLowerCase() === "jp") 
                  ? `${day.day_number}${getTranslatedDayWord(userLang)}` 
                  : `${getTranslatedDayWord(userLang)} ${day.day_number}`}
              </h2>
              <span className="text-[#a0978c] text-sm font-medium italic">
                {day.theme}
              </span>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-[#f0ece1] before:to-transparent">
              {day.activities?.map((act, aIdx) => (
                <div key={aIdx} className="relative flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-[#f0ece1] flex items-center justify-center text-lg z-10 shrink-0 shadow-sm border-[3px] border-white">
                    {getTypeEmoji(act.type)}
                  </div>
                  <div className="pt-1 w-full">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-[#c85a3c] uppercase tracking-wider text-[10px]">
                        {act.time_of_day}
                      </h3>
                      <span className="text-xs text-[#a0978c] font-medium bg-[#faf8f1] px-2 py-0.5 rounded-md">
                        {act.duration}
                      </span>
                    </div>
                    <h4 className="font-['Playfair_Display',serif] text-xl font-bold text-[#2f2722] mb-1.5">
                      {act.place_name}
                    </h4>
                    <p className="text-[#a0978c] text-sm leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TourResults;
