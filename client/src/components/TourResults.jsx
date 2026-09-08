import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "./Toast";
import { useOffline } from "../hooks/useOffline";
import { Landmark, UtensilsCrossed, Trees, Hotel, MapPin, Wand2, AlertTriangle, Sparkles, Wallet, Check, Bookmark } from "lucide-react";


const TourResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchDestination = location.state?.destination || "";
  
  const user = JSON.parse(sessionStorage.getItem("user") || '{}');
  const userLang = user.preferred_language || "English";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
   const [tour, setTour] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const dayRefs = useRef([]);
  const showToast = useToast();
  const isOffline = useOffline();

  useEffect(() => {
    if (!searchDestination) { navigate("/dashboard"); return; }
    
    // Check if we passed a cached tour (e.g. from Saved Trips)
    if (location.state?.cachedTour) {
      setTour(location.state.cachedTour);
      setIsSaved(true);
      setLoading(false);
      return;
    }

    const generateTour = async () => {
      try {
        setLoading(true);
        const res = await api.post("/tours/generate", {
          destination: searchDestination,
          days: 3,
          language: userLang
        });
        setTour(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to generate your tour. Our AI might be taking a break!");
      } finally {
        setLoading(false);
      }
    };
    generateTour();
  }, [searchDestination, navigate, location.state]);

  const scrollToDay = (idx) => {
    setActiveDay(idx);
    dayRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSaveTour = async () => {
    if (!tour || isSaving || isSaved) return;
    
    const token = sessionStorage.getItem("token");
    if (!token) return showToast("Please log in to save tours!", "error");
    
    if (isOffline) return showToast("You are offline. Cannot save tour right now.", "warning");

    try {
      setIsSaving(true);
      await api.post("/tours/save", {
        title: tour.title,
        destination: tour.destination,
        itinerary: tour,
        user_id: user.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsSaved(true);
      showToast("Tour saved to your trips!", "success");
    } catch (err) {
      console.error("Failed to save tour:", err);
      showToast("Failed to save tour. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case "CULTURE": return Landmark;
      case "DINING": return UtensilsCrossed;
      case "NATURE": return Trees;
      case "HOTELS": return Hotel;
      default: return MapPin;
    }
  };

  const getTranslatedDayWord = (lang) => {
    const l = lang?.toLowerCase() || "";
    if (l === "fr" || l === "french") return "Jour";
    if (l === "es" || l === "spanish") return "Día";
    if (l === "de" || l === "german") return "Tag";
    if (l === "it" || l === "italian") return "Giorno";
    if (l === "pt" || l === "portuguese") return "Dia";
    if (l === "jp" || l === "japanese") return "日目";
    return "Day";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans transition-colors duration-300">
        {/* Animated gradient bar */}
        <div className="w-24 h-24 rounded-full mb-8 flex items-center justify-center"
          style={{ background: "conic-gradient(from 0deg, #4f46e5, #dcb35f, #9ebc90, #4f46e5)", animation: "spin 1.8s linear infinite" }}>
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center transition-colors">
            <Wand2 className="w-8 h-8" />
          </div>
        </div>
        <h2 className="font-display tracking-tight text-3xl font-bold text-slate-900 dark:text-white mb-3 transition-colors" style={{ animation: "fadeIn 0.5s ease-out 0.2s both" }}>
          Crafting your journey...
        </h2>
        <p className="text-slate-500 max-w-[260px] leading-relaxed" style={{ animation: "fadeIn 0.5s ease-out 0.4s both" }}>
          Our AI is exploring hidden gems and vibrant spots in <strong className="text-indigo-600">{searchDestination}</strong>.
        </p>
        {/* Pulsing dots */}
        <div className="flex space-x-2 mt-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-indigo-600 rounded-full"
              style={{ animation: `fadeIn 0.5s ease-in-out ${0.8 + i * 0.2}s infinite alternate` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Oops!</h2>
        <p className="text-indigo-600 mb-6">{error}</p>
        <button 
          onClick={() => navigate("/dashboard")}
          className="bg-slate-900 dark:bg-slate-900 text-white px-6 py-3 rounded-2xl font-semibold border border-transparent dark:border-slate-700 transition-colors"
        >
          Try a different destination
        </button>
      </div>
    );
  }

  if (!tour) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans pb-12 transition-colors duration-300">
      {/* Header */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white pt-12 pb-10 rounded-b-[2.5rem] px-6 relative shadow-lg transition-colors">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-6 hover:bg-white/20 transition backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex items-center space-x-2 text-amber-500 text-xs font-bold tracking-widest uppercase mb-2">
          <Sparkles className="w-4 h-4" /><span>AI Smart Itinerary</span>
        </div>
        <h1 className="font-display tracking-tight text-[2.5rem] font-bold leading-tight mb-2">{tour.title}</h1>
        <div className="flex items-center text-slate-500 space-x-3 text-sm font-medium">
          <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {tour.destination}</span>
          <span>•</span>
          <span className="flex items-center"><Wallet className="w-3.5 h-3.5 mr-1" /> {tour.budget_estimate}</span>
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSaveTour}
          disabled={isSaving || isSaved}
          className={`absolute bottom-6 right-6 px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center space-x-2 shadow-lg transition-all active:scale-95 ${
            isSaved 
              ? "bg-teal-500 text-white" 
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          } ${(isSaving || isSaved) && "opacity-80 cursor-default"}`}
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : isSaved ? (
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> {t ? t('tour.saved', 'Saved') : 'Saved'}</span>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              <span>{t ? t('tour.save_tour', 'Save to My Trips') : 'Save to My Trips'}</span>
            </>
          )}
        </button>
      </div>

      {/* Sticky Day Tab Navigation */}
      {tour.days && tour.days.length > 1 && (
        <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-[#222] px-6 py-3 flex space-x-2 overflow-x-auto scrollbar-hide transition-colors">
          {tour.days.map((day, idx) => (
            <button
              key={idx}
              onClick={() => scrollToDay(idx)}
              className={`flex-none px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                activeDay === idx
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {(userLang?.toLowerCase() === "japanese" || userLang?.toLowerCase() === "jp")
                ? `${day.day_number}${getTranslatedDayWord(userLang)}`
                : `${getTranslatedDayWord(userLang)} ${day.day_number}`}
            </button>
          ))}
        </div>
      )}

      {/* Itinerary Timeline */}
      <div className="px-6 mt-6 space-y-8">
        {tour.days?.map((day, dIdx) => (
          <div
            key={dIdx}
            ref={(el) => (dayRefs.current[dIdx] = el)}
            className="glass-panel rounded-3xl p-6 transition-all border-none"
            style={{ animation: `fadeInUp 0.45s ease-out ${dIdx * 0.1}s both`, scrollMarginTop: "70px" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full inline-block transition-colors">
                {(userLang?.toLowerCase() === "japanese" || userLang?.toLowerCase() === "jp")
                  ? `${day.day_number}${getTranslatedDayWord(userLang)}`
                  : `${getTranslatedDayWord(userLang)} ${day.day_number}`}
              </h2>
              <span className="text-slate-500 text-sm font-medium italic">{day.theme}</span>
            </div>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-linear-to-b before:from-slate-100 dark:before:from-slate-700 before:to-transparent">
              {day.activities?.map((act, aIdx) => (
                <div key={aIdx} className="relative flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center z-10 shrink-0 shadow-sm border-[3px] border-white dark:border-slate-900 transition-colors">
                    {(() => { const Icon = getTypeIcon(act.type); return <Icon className="w-5 h-5" />; })()}
                  </div>
                  <div className="pt-1 w-full">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-indigo-600 uppercase tracking-wider text-[10px]">{act.time_of_day}</h3>
                      <span className="text-xs text-slate-500 dark:text-gray-400 font-medium bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md transition-colors">{act.duration}</span>
                    </div>
                    <h4 className="font-display tracking-tight text-xl font-bold text-slate-900 dark:text-white mb-1.5 transition-colors">{act.place_name}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{act.description}</p>
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
