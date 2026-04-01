import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SavedPlaces = () => {
  const navigate = useNavigate();
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPlaces = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_BASE}/places/saved`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSavedPlaces(data.saved_places);
        }
      } catch (error) {
        console.error("Failed to fetch saved places:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPlaces();
  }, [navigate]);

  const handleUnsave = async (e, placeId) => {
    e.stopPropagation();
    const token = sessionStorage.getItem("token");
    if (!window.confirm("Remove from saved places?")) return;

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/places/save/${placeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setSavedPlaces(savedPlaces.filter(p => p.id !== placeId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getEmoji = (category) => {
    if (category?.includes('Restaurant')) return '🍽️';
    if (category?.includes('Park')) return '🌳';
    if (category?.includes('Historical')) return '🏛️';
    if (category?.includes('Attraction')) return '📸';
    return '📍';
  };

  const colors = ['bg-[#89adc7]', 'bg-[#9ebc90]', 'bg-[#e2dac9]', 'bg-[#ffc875]', 'bg-[#fc84a1]'];

  return (
    <div className="min-h-screen bg-[#faf8f1] text-[#2f2722] font-['Inter',sans-serif] pb-24">
      {/* Header */}
      <header className="bg-[#2f2722] pt-12 pb-8 px-6 rounded-b-[2.5rem] shadow-lg relative">
        <button 
          onClick={() => navigate("/dashboard")}
          className="absolute top-12 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition backdrop-blur-sm shadow-sm text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="text-center text-white mt-4 mb-2">
          <h1 className="font-['Playfair_Display',serif] text-[2rem] leading-tight font-bold tracking-tight">Saved Places</h1>
          <p className="text-[#dcb35f] text-sm mt-2 font-medium tracking-wide uppercase">Your Collection</p>
        </div>
      </header>

      <main className="px-6 mt-8">
        {loading ? (
          <p className="text-center text-[#a0978c] animate-pulse font-medium">Loading your favorites...</p>
        ) : savedPlaces.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl shadow-sm border border-[#f0ece1]">
            <span className="text-5xl block mb-3 opacity-50">🧭</span>
            <p className="text-[#a0978c] font-medium">You haven't saved any places yet!</p>
            <button 
              onClick={() => navigate("/dashboard")}
              className="mt-6 bg-[#2f2722] text-white px-6 py-2.5 rounded-2xl font-semibold hover:bg-[#c85a3c] transition-colors"
            >
              Explore Destinations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {savedPlaces.map((place) => {
               const bgColor = colors[place.id % colors.length];
               return (
                <div 
                  key={place.id}
                  onClick={() => navigate(`/places/${place.id}`)}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-[#f0ece1] active:scale-95"
                >
                  <div className={`h-28 ${bgColor} flex items-center justify-center relative`}>
                     {/* Unsave Button */}
                     <div 
                       onClick={(e) => handleUnsave(e, place.id)}
                       className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#c85a3c] hover:bg-white transition-colors shadow-sm"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                     </div>
                     <span className="text-5xl drop-shadow-md">{getEmoji(place.category)}</span>
                  </div>
                  <div className="p-4 pt-3">
                    <h3 className="font-['Playfair_Display',serif] text-sm font-bold text-[#2f2722] truncate block leading-tight">{place.name}</h3>
                    <div className="flex items-center space-x-1 mt-1 text-[11px] font-bold text-[#a0978c]">
                       <span>📍</span>
                       <span className="truncate">{place.category}</span>
                    </div>
                  </div>
                </div>
               );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedPlaces;
