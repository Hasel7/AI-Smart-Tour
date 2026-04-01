import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedPlaces, setSavedPlaces] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);

  // We parse the user from sessionStorage. Fallback to 'Amara' if not found.
  const user = JSON.parse(
    sessionStorage.getItem("user") || '{"full_name": "Amara"}',
  );
  const firstName = user.full_name ? user.full_name.split(" ")[0] : "Amara";
  const initial = firstName.charAt(0).toUpperCase();

  // Load preferences
  const currentPrefs = JSON.parse(
    sessionStorage.getItem("travel_preferences") || "[]",
  );
  const hasPreferences = currentPrefs.length > 0;

  // Find matching places
  const recommendedPlaces = places.filter((p) => {
    if (!hasPreferences) return false;
    return currentPrefs.some((pref) => p.category?.includes(pref));
  });

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    
    const fetchPlaces = async () => {
      try {
        const response = await fetch(`${API_BASE}/places`);
        if (response.ok) {
          const data = await response.json();
          setPlaces(data.places);
        }

        // Now, fetch which places this user has saved
        const token = sessionStorage.getItem("token");
        if (token) {
          const savedRes = await fetch(
            `${API_BASE}/places/saved`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            // Store saved place IDs in a Set for super fast lookups
            const savedIds = savedData.saved_places.map((p) => p.id);
            setSavedPlaces(new Set(savedIds));
          }
        }
      } catch (error) {
        console.error("Failed to fetch places:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();

    // ────────────── LIVE GEOLOCATION ──────────────
    const handleLocationFallback = async () => {
      try {
        setGeoError("GPS blocked. Estimating city via internet IP...");
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.latitude && data.longitude) {
          setUserLocation({
            lat: data.latitude,
            lng: data.longitude,
          });
        } else {
          setGeoError("Location access unavailable. Showing default spots.");
        }
      } catch (err) {
        setGeoError("Location access unavailable. Showing default spots.");
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation Error:", error.message);
          handleLocationFallback();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    } else {
      handleLocationFallback();
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      const fetchLivePlaces = async () => {
        try {
          setLoading(true);
          const { lat, lng } = userLocation;
          
          // Using Mapbox Geocoding API (v5) for POIs
          const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!MAPBOX_TOKEN) {
            setGeoError("Please put your Mapbox token in client/.env as VITE_MAPBOX_TOKEN. Showing defaults for now.");
            setLoading(false);
            return;
          }

          const categories = "restaurant,museum,attraction,historic";
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${categories}.json?proximity=${lng},${lat}&limit=20&access_token=${MAPBOX_TOKEN}`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data && data.features) {
            const livePlaces = data.features.map(feat => {
              let cat = "Attraction";
              const typeStr = (feat.place_type || []).join() + " " + (feat.properties?.category || "");
              if (typeStr.includes("restaurant") || typeStr.includes("food")) cat = "Restaurant";
              if (typeStr.includes("museum")) cat = "Museum";
              if (typeStr.includes("historic")) cat = "Historical";
              if (typeStr.includes("park") || typeStr.includes("nature")) cat = "Nature";
              
              return {
                id: feat.id,
                name: feat.text,
                category: cat,
                latitude: feat.center[1],
                longitude: feat.center[0],
                description: feat.properties?.address || feat.place_name || "A wonderful spot near you.",
                rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1)
              };
            });
              
            if (livePlaces.length > 0) {
              setPlaces(livePlaces);
              setGeoError(null);
            } else {
              setGeoError("No popular tourist spots found on Mapbox. Showing defaults.");
            }
          }
        } catch (err) {
          console.error("Mapbox API error:", err);
          setGeoError("Failed to fetch live spots from Mapbox. Showing defaults.");
        } finally {
          setLoading(false);
        }
      };
      fetchLivePlaces();
    }
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
          body: JSON.stringify({ place_id: placeId }),
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
    if (hour < 12) return "Good morning,";
    if (hour < 18) return "Good afternoon,";
    return "Good evening,";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate("/tour-results", { state: { destination: searchQuery } });
  };

  return (
    <div className="min-h-screen bg-[#faf8f1] text-[#2f2722] font-['Inter',sans-serif] relative pb-24 font-medium">
      {/* 
        ========================================
        HEADER
        ======================================== 
      */}
      <header className="px-6 pt-10 pb-6 flex items-center justify-between">
        <div>
          <p className="text-[#a0978c] text-sm">{getGreeting()}</p>
          <h1 className="font-['Playfair_Display',serif] text-3xl font-bold flex items-center space-x-2 mt-1">
            <span>{firstName}</span>
            <span className="text-2xl">👋</span>
          </h1>
        </div>

        {/* Avatar Profile */}
        <div
          onClick={handleLogout}
          title="Sign out"
          className="w-11 h-11 rounded-full bg-[#c85a3c] text-white flex items-center justify-center font-bold text-lg cursor-pointer shadow-sm hover:bg-[#b04523] transition-colors"
        >
          {initial}
        </div>
      </header>

      <main className="px-6 space-y-8">
        {/* 
          ========================================
          SEARCH BAR
          ======================================== 
        */}
        <form
          onSubmit={handleSearch}
          className="relative flex items-center bg-[#f0ece1] rounded-2xl p-2 shadow-sm"
        >
          <div className="ml-3 text-[#6c64bc]">
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
            placeholder="Search destinations..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[#2f2722] placeholder-[#a0978c] px-3 font-medium outline-none"
          />
          <button
            type="submit"
            className="bg-[#c85a3c] text-white text-sm font-semibold py-2.5 px-5 rounded-xl flex items-center space-x-1.5 hover:bg-[#b04523] shadow-sm"
          >
            {/* Lightning bolt icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-[#ffc875]"
            >
              <path
                fillRule="evenodd"
                d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
                clipRule="evenodd"
              />
            </svg>
            <span>Plan</span>
          </button>
        </form>

        {/* 
          ========================================
          AI PICKS FOR YOU
          ======================================== 
        */}
        {/* 
          ========================================
          AI PICKS FOR YOU (or Preferences Prompt)
          ======================================== 
        */}
        <div
          onClick={() => {
            if (!hasPreferences) {
              navigate("/preferences");
            } else if (recommendedPlaces.length > 0) {
              navigate(`/tour-results`, {
                state: { destination: recommendedPlaces[0].name },
              });
            } else {
              navigate("/tour-results", {
                state: { destination: "Popular spots" },
              });
            }
          }}
          className="bg-[#2f2722] rounded-3xl p-5 flex items-center space-x-4 shadow-lg cursor-pointer transform hover:scale-[1.02] transition-transform"
        >
          <div className="bg-[#3a312a] p-3 rounded-2xl shrink-0">
            {/* Robot/Sparkle Icon */}
            <div className="text-3xl">{hasPreferences ? "✨" : "🤖"}</div>
          </div>
          <div className="flex-1">
            <h3 className="text-[#dcb35f] text-[10px] font-bold tracking-widest uppercase mb-1">
              {hasPreferences ? "Personalized For You" : "AI Picks For You"}
            </h3>
            <p className="text-white text-sm leading-tight pr-4 font-medium">
              {hasPreferences
                ? `${recommendedPlaces.length > 0 ? recommendedPlaces.length : "Multiple"} new places match your taste in ${currentPrefs[0]}!`
                : "Tap here to tell us what type of traveler you are."}
            </p>
          </div>
          <div className="text-[#c85a3c] pr-2">
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
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </div>
        </div>

        {/* 
          ========================================
          CATEGORIES
          ======================================== 
        */}
        <section>
          <h2 className="font-['Playfair_Display',serif] text-2xl font-bold mb-4 text-[#2f2722]">
            Categories
          </h2>
          <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide -mx-6 px-6">
            {/* All */}
            <div className="flex flex-col flex-none items-center justify-center bg-[#1c1815] text-white w-20 h-24 rounded-2xl shadow-sm cursor-pointer">
              <span className="text-2xl mb-2">🗺️</span>
              <span className="text-[10px] font-semibold tracking-wider">
                ALL
              </span>
            </div>
            {/* Culture */}
            <div className="flex flex-col flex-none items-center justify-center bg-[#f0ece1] text-[#a0978c] w-20 h-24 rounded-2xl cursor-pointer hover:bg-[#e6e1d4] transition-colors">
              <span className="text-2xl mb-2 opacity-80">🏛️</span>
              <span className="text-[10px] font-semibold tracking-wider">
                CULTURE
              </span>
            </div>
            {/* Dining */}
            <div className="flex flex-col flex-none items-center justify-center bg-[#f0ece1] text-[#a0978c] w-20 h-24 rounded-2xl cursor-pointer hover:bg-[#e6e1d4] transition-colors">
              <span className="text-2xl mb-2 opacity-80">🍽️</span>
              <span className="text-[10px] font-semibold tracking-wider">
                DINING
              </span>
            </div>
            {/* Hotels */}
            <div className="flex flex-col flex-none items-center justify-center bg-[#f0ece1] text-[#a0978c] w-20 h-24 rounded-2xl cursor-pointer hover:bg-[#e6e1d4] transition-colors">
              <span className="text-2xl mb-2 opacity-80">🏨</span>
              <span className="text-[10px] font-semibold tracking-wider">
                HOTELS
              </span>
            </div>
            {/* Nature */}
            <div className="flex flex-col flex-none items-center justify-center bg-[#f0ece1] text-[#a0978c] w-20 h-24 rounded-2xl cursor-pointer hover:bg-[#e6e1d4] transition-colors">
              <span className="text-2xl mb-2 opacity-80">🌳</span>
              <span className="text-[10px] font-semibold tracking-wider">
                NATURE
              </span>
            </div>
          </div>
        </section>

        {/* 
          ========================================
          NEARBY PLACES (LIVE GEOLOCATION)
          ======================================== 
        */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-['Playfair_Display',serif] text-2xl font-bold text-[#2f2722]">
                {userLocation ? "Near Your Location" : "Places To Explore"}
              </h2>
              {userLocation && (
                <p className="text-[#a0978c] text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1.5 animate-pulse"></span>
                  LIVE GPS DETECTED
                </p>
              )}
              {geoError && (
                <p className="text-[#c85a3c] text-xs font-semibold mt-0.5">
                  {geoError}
                </p>
              )}
            </div>

            <a
              href="#"
              className="text-[#c85a3c] text-sm font-semibold flex items-center hover:underline"
            >
              See all <span className="ml-1 text-lg mb-0.5">&rarr;</span>
            </a>
          </div>

          <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide -mx-6 px-6">
            {loading ? (
              <p className="text-[#a0978c] text-sm animate-pulse">
                Loading amazing places...
              </p>
            ) : places.length === 0 ? (
              <p className="text-[#a0978c] text-sm">
                No places found. Go to Supabase and add some!
              </p>
            ) : (
              places.map((place) => {
                // Determine a background color based on ID to make it colorful
                const colors = [
                  "bg-[#89adc7]",
                  "bg-[#9ebc90]",
                  "bg-[#e2dac9]",
                  "bg-[#ffc875]",
                  "bg-[#fc84a1]",
                ];
                const bgColor = colors[place.id % colors.length];

                // Pick a random emoji if category doesn't inherently give one
                const getEmoji = (category) => {
                  if (category?.includes("Restaurant")) return "🍽️";
                  if (category?.includes("Park")) return "🌳";
                  if (category?.includes("Historical")) return "🏛️";
                  if (category?.includes("Attraction")) return "📸";
                  return "📍";
                };

                const isSaved = savedPlaces.has(place.id);

                return (
                  <div
                    key={place.id}
                    onClick={() => navigate(`/places/${place.id}`)}
                    className="flex-none w-[200px] bg-[#f0ece1] rounded-[4xl] overflow-hidden shadow-sm relative cursor-pointer hover:shadow-md transition-all active:scale-95"
                  >
                    {/* Heart Icon */}
                    <div
                      onClick={(e) => toggleSavePlace(e, place.id)}
                      className={`absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm z-10 transition-colors ${isSaved ? "text-[#c85a3c]" : "text-[#a0978c] hover:text-[#c85a3c]"}`}
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
                      className={`h-[140px] ${bgColor} flex items-center justify-center`}
                    >
                      <span className="text-6xl drop-shadow-lg">
                        {getEmoji(place.category)}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 pt-5 pb-5">
                      <h3
                        className="font-['Playfair_Display',serif] text-[1.15rem] font-bold text-[#2f2722] mb-1 leading-tight truncate"
                        title={place.name}
                      >
                        {place.name}
                      </h3>
                      <div className="flex justify-between items-center text-xs text-[#a0978c] font-medium mb-1.5">
                        <div className="flex items-center space-x-1">
                          <span className="text-[#fc84a1]">📍</span>
                          <span
                            className="truncate max-w-[70px]"
                            title={place.category}
                          >
                            {place.category}
                          </span>
                        </div>
                        <div className="flex items-center text-[#2f2722] font-semibold">
                          <span className="text-[#dcb35f] mr-1 text-sm">★</span>
                          {place.rating || "4.5"}
                        </div>
                      </div>
                      <p className="text-[#3c7653] text-[11px] font-bold line-clamp-2 mt-2 leading-relaxed h-8">
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

      {/* 
        ========================================
        BOTTOM NAVIGATION
        ======================================== 
      */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#faf8f1] border-t border-[#e2dac9] px-6 py-4 flex justify-between items-center z-50">
        <div className="flex flex-col items-center space-y-1">
          <span className="text-2xl mb-0.5">🏠</span>
          <span className="text-[#c85a3c] text-[9px] font-bold tracking-widest uppercase">
            HOME
          </span>
          <div className="w-1 h-1 bg-[#c85a3c] rounded-full mt-0.5"></div>
        </div>

        <div
          onClick={() => navigate("/map")}
          className="flex flex-col items-center space-y-1 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <span className="text-2xl mb-0.5">🗺️</span>
          <span className="text-[#a0978c] text-[9px] font-bold tracking-widest uppercase">
            MAP
          </span>
          <div className="w-1 h-1 bg-transparent mt-0.5"></div>
        </div>

        <div
          onClick={() => navigate("/saved")}
          className="flex flex-col items-center space-y-1 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <span className="text-2xl mb-0.5">💖</span>
          <span className="text-[#a0978c] text-[9px] font-bold tracking-widest uppercase">
            SAVED
          </span>
          <div className="w-1 h-1 bg-transparent mt-0.5"></div>
        </div>

        <div
          onClick={() => navigate("/profile")}
          className="flex flex-col items-center space-y-1 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <span className="text-2xl mb-0.5">👤</span>
          <span className="text-[#a0978c] text-[9px] font-bold tracking-widest uppercase">
            PROFILE
          </span>
          <div className="w-1 h-1 bg-transparent mt-0.5"></div>
        </div>
      </nav>

      {/* Hide scrollbar globally for webkit (Chrome/Safari) */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
