import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { findSurvivalGuide } from "../utils/countryData";
import BottomNav from "./BottomNav";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedPlaces, setSavedPlaces] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);
  const [countryName, setCountryName] = useState(null);
  const [regionName, setRegionName] = useState("");
  const [showSurvivalGuide, setShowSurvivalGuide] = useState(true);
  const [etiquetteIndex, setEtiquetteIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [geoError, setGeoError] = useState(null);
  const [isLiveGps, setIsLiveGps] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // We parse the user from sessionStorage. Fallback to 'Amara' if not found.
  const user = JSON.parse(
    sessionStorage.getItem("user") || '{"full_name": "Amara"}',
  );
  const firstName = user.full_name ? user.full_name.split(" ")[0] : "Amara";
  const initial = firstName.charAt(0).toUpperCase();


  useEffect(() => {
    // ────────────── LIVE GEOLOCATION ──────────────
    // Maps the browser's GeolocationPositionError code to a reason a user can act on.
    const describeGeoError = (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          return "Location permission denied for this site.";
        case error.POSITION_UNAVAILABLE:
          return "Device could not determine a position (no GPS/Wi-Fi signal).";
        case error.TIMEOUT:
          return "Location request timed out.";
        default:
          return error.message || "Unknown location error.";
      }
    };

    const handleLocationFallback = async (reason) => {
      try {
        setGeoError(`${reason} Estimating city via internet IP...`);
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (typeof data.latitude === "number" && typeof data.longitude === "number") {
          setIsLiveGps(false);
          setUserLocation({
            lat: data.latitude,
            lng: data.longitude,
          });
          setGeoError(`${reason} Showing spots near your estimated city (IP-based, may be inaccurate).`);
        } else {
          setGeoError(`${reason} IP lookup also failed. Showing default spots.`);
        }
      } catch (err) {
        setGeoError(`${reason} IP lookup also failed (${err.message}). Showing default spots.`);
      }
    };

    // Beyond this radius of uncertainty (meters), the coordinates are no more
    // trustworthy than an IP guess and shouldn't be presented as precise "Live GPS".
    const LOW_ACCURACY_THRESHOLD_METERS = 10000;

    const applyPosition = (position) => {
      const accuracy = position.coords.accuracy;
      console.info(`Geolocation accuracy: ~${Math.round(accuracy)}m`);
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      if (accuracy > LOW_ACCURACY_THRESHOLD_METERS) {
        setIsLiveGps(false);
        setGeoError(`Low location accuracy (~${(accuracy / 1000).toFixed(1)}km radius) — likely from mobile data/hotspot with no Wi-Fi to triangulate against. Results may not match your exact area.`);
      } else {
        setIsLiveGps(true);
        setGeoError(null);
      }
    };

    if ("geolocation" in navigator) {
      // 1st attempt: High accuracy (hardware GPS / fast Wi-Fi) with 6s timeout
      navigator.geolocation.getCurrentPosition(
        applyPosition,
        (error) => {
          const reason = describeGeoError(error);
          console.warn("High-accuracy geolocation failed/timed out:", reason);
          // 2nd attempt: Low accuracy (coarse network location) with 6s timeout
          navigator.geolocation.getCurrentPosition(
            applyPosition,
            (errCoarse) => {
              const coarseReason = describeGeoError(errCoarse);
              console.warn("Low-accuracy geolocation failed:", coarseReason);
              // 3rd attempt: IP-based location fallback
              handleLocationFallback(coarseReason);
            },
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
          );
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 300000 }
      );
    } else {
      handleLocationFallback("Geolocation not supported by this browser.");
    }
  }, []);

  // ────────────── REVERSE GEOCODING (COUNTRY DETECTION) ──────────────
  useEffect(() => {
    if (userLocation && !countryName) {
      const fetchCountryLocality = async () => {
        try {
          // Extremely fast, free reverse-geocode API for locality resolution
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${userLocation.lat}&longitude=${userLocation.lng}&localityLanguage=en`);
          const data = await res.json();
          if (data && data.countryName) {
            setCountryName(data.countryName);
            setRegionName(data.principalSubdivision || data.city || "");
          }
        } catch (e) {
          console.error("Failed to reverse geocode:", e);
        }
      };
      fetchCountryLocality();
    }
  }, [userLocation, countryName]);

  // ────────────── ETIQUETTE & PHRASE ROTATION ──────────────
  useEffect(() => {
    if (countryName && showSurvivalGuide) {
      const guide = findSurvivalGuide(countryName, regionName);
      let etiquetteInterval;
      let phraseInterval;
      
      if (guide) {
        if (guide.etiquettes && guide.etiquettes.length > 1) {
          etiquetteInterval = setInterval(() => {
            setEtiquetteIndex(prev => (prev + 1) % guide.etiquettes.length);
          }, 7000);
        }
        if (guide.phrases && guide.phrases.length > 1) {
          phraseInterval = setInterval(() => {
            setPhraseIndex(prev => (prev + 1) % guide.phrases.length);
          }, 4500); // Rotates slightly faster than etiquette
        }
      }
      return () => {
        if(etiquetteInterval) clearInterval(etiquetteInterval);
        if(phraseInterval) clearInterval(phraseInterval);
      };
    }
  }, [countryName, showSurvivalGuide]);

  useEffect(() => {
    if (!userLocation) return;
    const loadPlaces = async () => {
      setLoading(true);
      const { lat, lng } = userLocation;
      const token = sessionStorage.getItem("token");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const prefCategories = JSON.parse(sessionStorage.getItem("travel_preferences") || "[]");

      // Step 1 — Fetch saved places (heart icons + ML input), one request for both
      let likedNames = [];
      if (token) {
        try {
          const savedRes = await fetch(`${API_BASE}/places/saved`, { headers: { Authorization: `Bearer ${token}` } });
          const savedData = await savedRes.json();
          const savedList = savedData.saved_places || [];
          likedNames = savedList.map(p => p.name).filter(Boolean);
          setSavedPlaces(new Set(savedList.map(p => p.place_id)));
        } catch (err) {
          console.warn("Failed to fetch saved places:", err);
        }
      }

      // Step 2 — Fetch nearby places from Google Places API
      const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      if (!GOOGLE_API_KEY || GOOGLE_API_KEY.includes("your_google_api_key")) {
        setGeoError("Please put your Google API key in client/.env as VITE_GOOGLE_PLACES_API_KEY. Showing defaults for now.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
          method: "POST",
          headers: {
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "places.displayName,places.location,places.primaryType,places.formattedAddress,places.id,places.rating,places.editorialSummary,places.types,places.photos",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            includedTypes: ["restaurant", "museum", "historical_landmark", "park", "tourist_attraction", "lodging", "stadium", "sports_club", "bar"],
            maxResultCount: 20,
            languageCode: i18n.language || "en",
            locationRestriction: {
              circle: { center: { latitude: lat, longitude: lng }, radius: 5000.0 }
            }
          })
        });

        const data = await response.json();

        if (data && data.places && data.places.length > 0) {
          const livePlaces = data.places.map(place => {
            let cat = "Attraction";
            const types = place.types || [];
            if (types.includes("restaurant") || types.includes("food") || types.includes("cafe")) cat = "Restaurant";
            else if (types.includes("museum") || types.includes("art_gallery")) cat = "Museum";
            else if (types.includes("historical_landmark") || types.includes("place_of_worship")) cat = "Historical";
            else if (types.includes("park") || types.includes("national_park") || types.includes("campground")) cat = "Nature";
            else if (types.includes("lodging") || types.includes("hotel")) cat = "Hotel";
            else if (types.includes("stadium") || types.includes("sports_club") || types.includes("bar")) cat = "Sports";
            const photo = place.photos?.[0]?.name || null;
            return {
              id: place.id || Math.random().toString(),
              name: place.displayName?.text || t('dashboard.amazing_spot', 'Amazing Tourist Spot'),
              category: cat,
              latitude: place.location?.latitude || lat,
              longitude: place.location?.longitude || lng,
              description: place.editorialSummary?.text || place.formattedAddress || t('dashboard.beautiful_place', 'A beautiful place to visit.'),
              rating: place.rating || null,
              photoUrl: photo ? `https://places.googleapis.com/v1/${photo}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_API_KEY}` : null,
              aiScore: 0,
            };
          });

          setPlaces(livePlaces);
        } else {
          const errorMsg = data?.error?.message
            ? `Google Error: ${data.error.message}`
            : "No popular tourist spots found nearby on Google Maps.";
          setGeoError(`${errorMsg} Showing defaults.`);
        }
      } catch (err) {
        console.error("Google Places API error:", err);
        setGeoError(`Failed to fetch live spots from Google (${err.message}). Showing defaults.`);
      } finally {
        setLoading(false);
      }
    };
    loadPlaces();
  }, [userLocation]);

  // ── Fetch Personalized AI Recommendations (Live Hybrid) ──
  useEffect(() => {
    if (!userLocation) return;
    const fetchAIRecs = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const prefCategories = JSON.parse(sessionStorage.getItem("travel_preferences") || "[]");

      try {
        const res = await fetch(`${API_BASE}/recommendations`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ 
            user_lat: userLocation.lat, 
            user_lng: userLocation.lng,
            preferred_categories: prefCategories,
            top_n: 6
          })
        });
        if (res.ok) {
          const data = await res.json();
          setAiRecommendations(data.recommendations || []);
        }
      } catch (err) {
        console.info("ML service offline, skipping AI recs.");
      }
    };
    fetchAIRecs();
  }, [userLocation]);

  const toggleSavePlace = async (e, placeId) => {
    e.stopPropagation(); // Prevent the user from navigating if they just clicked the heart
    const token = sessionStorage.getItem("token");
    if (!token) return alert("Please log in to save places!");
    
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const isSaved = savedPlaces.has(placeId);

    try {
      if (isSaved) {
        // Unsave the place
        await fetch(`${API_BASE}/places/save/${placeId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Update UI immediately (Optimistic update)
        setSavedPlaces((prev) => {
          const newSet = new Set(prev);
          newSet.delete(placeId);
          return newSet;
        });
      } else {
        // Save the place
        await fetch(`${API_BASE}/places/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            place_id: placeId,
            place_name: places.find(p => p.id === placeId)?.name || null
          }),
        });

        // Update UI immediately
        setSavedPlaces((prev) => new Set(prev).add(placeId));
      }
    } catch (err) {
      console.error("Failed to toggle save", err);
    }
  };

  const handleLogout = () => {
    navigate("/profile");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.good_morning');
    if (hour < 18) return t('dashboard.good_afternoon');
    return t('dashboard.good_evening');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate("/tour-results", { state: { destination: searchQuery } });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans relative pb-24 font-medium transition-colors duration-300">
      {/* 
        ========================================
        HEADER
        ======================================== 
      */}
      <header className="px-6 pt-10 pb-6 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">{getGreeting()}</p>
          <h1 className="font-display tracking-tight text-3xl font-bold flex items-center space-x-2 mt-1">
            <span>{firstName}</span>
            <span className="text-2xl">👋</span>
          </h1>
        </div>

        {/* Avatar & Toggle */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 text-xl flex items-center justify-center transition-colors shadow-sm"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <div
            onClick={handleLogout}
            title="Sign out"
            className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg cursor-pointer shadow-sm hover:bg-indigo-700 transition-colors"
          >
            {initial}
          </div>
        </div>
      </header>

      <main className="px-6 space-y-10">
        {/* Recommended for You section (AI-powered) */}
        {aiRecommendations.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 bg-linear-to-br from-indigo-600 to-amber-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20">✨</div>
              <div>
                <h2 className="font-display tracking-tight text-2xl font-bold dark:text-white">Recommended for You</h2>
                <div className="flex items-center space-x-1.5">
                   <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Live Hybrid Feed</p>
                   <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AI Match</p>
                </div>
              </div>
            </div>

            <div className="flex overflow-x-auto space-x-5 pb-6 scrollbar-hide -mx-6 px-6">
              {aiRecommendations.map((rec, i) => {
                const score = rec.score || 0.85;
                const getEmoji = (c) => {
                  const cat = c?.toLowerCase() || "";
                  if (cat.includes("nature") || cat.includes("park")) return "🌿";
                  if (cat.includes("museum") || cat.includes("art")) return "🏛️";
                  if (cat.includes("food") || cat.includes("restau")) return "🍽️";
                  if (cat.includes("hotel") || cat.includes("lodg")) return "🏨";
                  if (cat.includes("shop") || cat.includes("mall")) return "🛍️";
                  return "📍";
                };

                return (
                  <div 
                    key={i}
                    onClick={() => navigate(`/places/${rec.id}`)}
                    className="flex-none w-56 glass-panel rounded-3xl overflow-hidden cursor-pointer hover-glow group"
                  >
                    <div className="h-36 bg-slate-900 dark:bg-slate-950 flex items-center justify-center relative overflow-hidden">
                      {rec.photoUrl ? (
                        <img 
                          src={rec.photoUrl} 
                          alt={rec.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                        />
                      ) : (
                        <span className="text-6xl transform group-hover:scale-110 transition-transform duration-500">
                          {getEmoji(rec.category)}
                        </span>
                      )}
                      
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-950/50 backdrop-blur-md px-2 py-1 rounded-xl shadow-sm">
                        <span className="text-xs font-bold text-yellow-500">★ {rec.rating || "4.5"}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-sm truncate mb-0.5 dark:text-white uppercase tracking-tight">{rec.name}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">{rec.category}</p>
                      
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">AI PREDICTION</span>
                        <span className="text-[11px] font-black">{Math.round(score * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-linear-to-r from-indigo-600 to-amber-500 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.round(score * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {/* 
          ========================================
          SEARCH BAR
          ======================================== 
        */}
        <form
          onSubmit={handleSearch}
          className="relative flex items-center glass-panel rounded-2xl p-2 transition-all focus-within:shadow-md focus-within:ring-2 focus-within:ring-indigo-600/30"
        >
          <div className="ml-3 text-indigo-500">
            {/* Search Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('dashboard.search_destinations')}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white placeholder-[#a0978c] px-3 font-medium outline-none transition-colors"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white text-sm font-semibold py-2.5 px-5 rounded-xl flex items-center space-x-1.5 hover:bg-indigo-700 shadow-sm"
          >
            {/* Lightning bolt icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-amber-400"
            >
              <path
                fillRule="evenodd"
                d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t('dashboard.plan')}</span>
          </button>
        </form>

        {/* 
          ========================================
          SURVIVAL GUIDE WIDGET (BORDER CROSSING)
          ======================================== 
        */}
        {countryName && findSurvivalGuide(countryName, regionName) && showSurvivalGuide && (
          <div className="relative overflow-hidden rounded-4xl p-6 shadow-xl bg-linear-to-br from-slate-900/95 to-slate-950/90 backdrop-blur-2xl border border-white/5">
            {/* Close Button */}
            <button 
              onClick={() => setShowSurvivalGuide(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
               ✕
            </button>
            <div className="flex items-center space-x-3 mb-4">
               <span className="text-4xl">{findSurvivalGuide(countryName, regionName).flag}</span>
               <div>
                  <h3 className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-0.5">{t('survival.local_survival_guide')}</h3>
                  <h2 className="text-white font-display tracking-tight text-xl font-bold">{findSurvivalGuide(countryName, regionName).greeting}</h2>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-2xl p-4 flex flex-col justify-center text-center">
                <h4 className="text-amber-500 text-[10px] font-bold tracking-widest uppercase mb-4 flex justify-between items-center text-left">
                  <span>{t('survival.essential_phrases')}</span>
                  <span className="text-slate-500 opacity-50">{phraseIndex + 1}/{findSurvivalGuide(countryName, regionName).phrases?.length || 1}</span>
                </h4>
                <div key={phraseIndex} className="animate-[fadeIn_0.5s_ease-in-out]">
                  <div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                    {t(`survival.${(findSurvivalGuide(countryName, regionName).phrases[phraseIndex]?.meaning || "").toLowerCase().replace(/[^a-z0-9]/g, '_')}`, findSurvivalGuide(countryName, regionName).phrases[phraseIndex]?.meaning || "")}
                  </div>
                  <div className="text-white font-display tracking-tight text-3xl font-bold">{findSurvivalGuide(countryName, regionName).phrases[phraseIndex]?.text}</div>
                </div>
              </div>
              <div className="flex flex-col h-full">
                 <div className="bg-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-center">
                    <h4 className="text-teal-500 text-[10px] font-bold tracking-widest uppercase mb-1 flex justify-between items-center">
                      <span><span className="mr-1">💡</span> {t('survival.etiquette')}</span>
                      <span className="text-slate-500 opacity-50">{etiquetteIndex + 1}/{findSurvivalGuide(countryName, regionName).etiquettes?.length || 1}</span>
                    </h4>
                    <p key={etiquetteIndex} className="text-slate-200 text-xs font-medium leading-relaxed min-h-10 animate-[fadeIn_0.5s_ease-in-out]">
                      {(() => {
                        const rawEtiquette = findSurvivalGuide(countryName, regionName).etiquettes ? findSurvivalGuide(countryName, regionName).etiquettes[etiquetteIndex] : findSurvivalGuide(countryName, regionName).etiquette;
                        const safeKey = rawEtiquette ? "etiquette_" + rawEtiquette.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30).replace(/_+/g, '_').replace(/_$/, '') : 'unknown';
                        return t(`survival.${safeKey}`, rawEtiquette || "");
                      })()}
                    </p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/*
          ========================================
          CATEGORIES
          ======================================== 
        */}
        <section>
          <h2 className="font-display tracking-tight text-2xl font-bold mb-4 text-slate-900 dark:text-white transition-colors">
            {t('dashboard.categories')}
          </h2>
          <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide -mx-6 px-6">
            <div 
              onClick={() => setActiveCategory("ALL")}
              className={`flex flex-col flex-none items-center justify-center w-20 h-24 rounded-2xl cursor-pointer transition-colors ${activeCategory === "ALL" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}`}
            >
              <span className={`text-2xl mb-2 ${activeCategory !== "ALL" && "opacity-80"}`}>🗺️</span>
              <span className="text-[10px] font-semibold tracking-wider">{t('dashboard.cat_all')}</span>
            </div>
            <div 
              onClick={() => setActiveCategory("CULTURE")}
              className={`flex flex-col flex-none items-center justify-center w-20 h-24 rounded-2xl cursor-pointer transition-colors ${activeCategory === "CULTURE" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}`}
            >
              <span className={`text-2xl mb-2 ${activeCategory !== "CULTURE" && "opacity-80"}`}>🏛️</span>
              <span className="text-[10px] font-semibold tracking-wider">{t('dashboard.cat_culture')}</span>
            </div>
            <div 
              onClick={() => setActiveCategory("DINING")}
              className={`flex flex-col flex-none items-center justify-center w-20 h-24 rounded-2xl cursor-pointer transition-colors ${activeCategory === "DINING" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}`}
            >
              <span className={`text-2xl mb-2 ${activeCategory !== "DINING" && "opacity-80"}`}>🍽️</span>
              <span className="text-[10px] font-semibold tracking-wider">{t('dashboard.cat_dining')}</span>
            </div>
            <div 
              onClick={() => setActiveCategory("HOTELS")}
              className={`flex flex-col flex-none items-center justify-center w-20 h-24 rounded-2xl cursor-pointer transition-colors ${activeCategory === "HOTELS" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}`}
            >
              <span className={`text-2xl mb-2 ${activeCategory !== "HOTELS" && "opacity-80"}`}>🏨</span>
              <span className="text-[10px] font-semibold tracking-wider">{t('dashboard.cat_hotels')}</span>
            </div>
            <div 
              onClick={() => setActiveCategory("NATURE")}
              className={`flex flex-col flex-none items-center justify-center w-20 h-24 rounded-2xl cursor-pointer transition-colors ${activeCategory === "NATURE" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}`}
            >
              <span className={`text-2xl mb-2 ${activeCategory !== "NATURE" && "opacity-80"}`}>🌳</span>
              <span className="text-[10px] font-semibold tracking-wider">{t('dashboard.cat_nature')}</span>
            </div>
            <div 
              onClick={() => setActiveCategory("SPORTS")}
              className={`flex flex-col flex-none items-center justify-center w-20 h-24 rounded-2xl cursor-pointer transition-colors ${activeCategory === "SPORTS" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}`}
            >
              <span className={`text-2xl mb-2 ${activeCategory !== "SPORTS" && "opacity-80"}`}>⚽</span>
              <span className="text-[10px] font-semibold tracking-wider">{t('dashboard.cat_sports', 'SPORTS')}</span>
            </div>
          </div>
        </section>

        {/* 
          ========================================
          NEARBY PLACES (LIVE GEOLOCATION)
          ======================================== 
        */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display tracking-tight text-2xl font-bold text-slate-900 dark:text-white transition-colors">
                {userLocation ? t('dashboard.near_location') : t('dashboard.places_explore')}
              </h2>
              {userLocation && isLiveGps && (
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1.5 animate-pulse"></span>
                  {t('dashboard.live_gps')}
                </p>
              )}
              {geoError && (
                <p className="text-indigo-600 text-xs font-semibold mt-0.5">
                  {geoError}
                </p>
              )}
            </div>

            <button
              onClick={() => navigate("/saved")}
              className="text-indigo-600 text-sm font-semibold flex items-center hover:underline"
            >
              {t('dashboard.see_all', 'See all')} <span className="ml-1 text-lg mb-0.5">&rarr;</span>
            </button>
          </div>

          <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide -mx-6 px-6">
            {loading ? (
              // ── Skeleton Cards ──
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-none w-50 bg-slate-100 dark:bg-slate-800 rounded-[4xl] overflow-hidden border border-transparent dark:border-slate-700">
                  <div className="h-35 skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 rounded-full w-3/4" />
                    <div className="skeleton h-3 rounded-full w-1/2" />
                    <div className="skeleton h-3 rounded-full w-5/6" />
                  </div>
                </div>
              ))
            ) : places.length === 0 ? (
              <p className="text-slate-500 text-sm">
                {t('dashboard.no_places', 'No places found.')}
              </p>
            ) : (
              places.filter(p => {
                if (activeCategory === "ALL") return true;
                if (activeCategory === "CULTURE") return p.category === "Museum" || p.category === "Historical";
                if (activeCategory === "DINING") return p.category === "Restaurant";
                if (activeCategory === "HOTELS") return p.category === "Hotel";
                if (activeCategory === "NATURE") return p.category === "Nature";
                if (activeCategory === "SPORTS") return p.category === "Sports";
                return true;
              }).map((place) => {
                // Determine a background color based on ID to make it colorful
                const colors = [
                  "bg-sky-500",
                  "bg-teal-500",
                  "bg-slate-200",
                  "bg-amber-400",
                  "bg-rose-400",
                ];
                const charCode = place.name ? place.name.charCodeAt(0) : 0;
                const bgColor = colors[charCode % colors.length];

                // Pick a random emoji if category doesn't inherently give one
                const getEmoji = (category) => {
                  if (category?.includes("Restaurant")) return "🍽️";
                  if (category?.includes("Park")) return "🌳";
                  if (category?.includes("Historical")) return "🏛️";
                  if (category?.includes("Museum")) return "🏺";
                  if (category?.includes("Hotel") || category?.includes("Lodging")) return "🏨";
                  if (category?.includes("Sports")) return "⚽";
                  if (category?.includes("Attraction")) return "📸";
                  return "📍";
                };

                const isSaved = savedPlaces.has(place.id);

                return (
                  <div
                    key={place.id}
                    onClick={() => navigate(`/places/${place.id}`)}
                    className="flex-none w-50 glass-panel rounded-3xl overflow-hidden relative cursor-pointer hover-glow active:scale-95"
                    style={{ animation: `fadeInUp 0.45s ease-out ${Math.min(places.indexOf(place) * 0.06, 0.5)}s both` }}
                  >
                    {/* Heart Icon */}
                    <div
                      onClick={(e) => toggleSavePlace(e, place.id)}
                      className={`absolute top-3 right-3 w-8 h-8 bg-white/80 dark:bg-slate-950/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm z-10 transition-colors ${isSaved ? "text-indigo-600" : "text-slate-500 hover:text-indigo-600"}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill={isSaved ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        strokeWidth={isSaved ? 0 : 2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                        />
                      </svg>
                    </div>

                    {/* Image Header Area */}
                    <div
                      className={`h-35 ${bgColor} flex items-center justify-center bg-cover bg-center relative`}
                      style={place.photoUrl ? { backgroundImage: `url(${place.photoUrl})` } : {}}
                    >
                      {place.aiScore > 0 && (
                        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-500 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full border border-amber-500/50 shadow-lg flex items-center">
                           ✨ {Math.round(place.aiScore * 100)}% Match
                        </div>
                      )}
                      {!place.photoUrl && (
                        <span className="text-6xl drop-shadow-lg">
                          {getEmoji(place.category)}
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 pt-5 pb-5">
                      <h3
                        className="font-display tracking-tight text-[1.15rem] font-bold text-slate-900 dark:text-white mb-1 leading-tight truncate transition-colors"
                        title={place.name}
                      >
                        {place.name}
                      </h3>
                      <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1.5">
                        <div className="flex items-center space-x-1">
                          <span className="text-lg -mt-0.5">{getEmoji(place.category)}</span>
                          <span
                            className="truncate max-w-20"
                            title={place.category}
                          >
                            {(() => {
                              const rawCat = t(`dashboard.cat_${(place.category || '').toLowerCase()}`, place.category);
                              return rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center text-slate-900 dark:text-gray-300 font-semibold transition-colors">
                          <span className="text-amber-500 mr-1 text-sm">★</span>
                          {place.rating || "4.5"}
                        </div>
                      </div>
                      <p className="text-teal-700 dark:text-teal-400 text-[11px] font-bold line-clamp-2 mt-2 leading-relaxed h-8 transition-colors">
                        {place.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
