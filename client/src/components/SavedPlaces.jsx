import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BottomNav from "./BottomNav";
import { useToast } from "./Toast";
import { UtensilsCrossed, Trees, Landmark, Hotel, Volleyball, Camera, MapPin, Compass, Sparkles, Calendar, Map } from "lucide-react";

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-700"
      style={{ animation: "fadeInUp 0.25s ease-out both" }}>
      <p className="font-['Inter',sans-serif] text-slate-900 dark:text-white font-semibold mb-6 text-center">{message}</p>
      <div className="flex space-x-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-800 transition-colors">Remove</button>
      </div>
    </div>
  </div>
);

const SavedPlaces = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const showToast = useToast();
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [savedTours, setSavedTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("places"); // "places" or "trips"
  const [unsavingId, setUnsavingId] = useState(null);

  useEffect(() => {
    const fetchSavedItems = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return navigate("/login");
      const user = JSON.parse(sessionStorage.getItem("user") || '{}');
      
      try {
        setLoading(true);
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        
        // Fetch Places
        const placesRes = await fetch(`${API_BASE}/places/saved`, { headers: { Authorization: `Bearer ${token}` } });
        if (placesRes.ok) {
          const data = await placesRes.json();
          setSavedPlaces(data.saved_places);
          
          // Trigger lazy repair for places with placeholder names OR missing photo_url
          data.saved_places.forEach(p => {
            if ((p.name === 'Saved Place' || !p.photo_url) && p.id.length > 10) {
              repairMetadata(p.id, token);
            }
          });
        }

        // Fetch Tours
        const toursRes = await fetch(`${API_BASE}/tours/saved/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (toursRes.ok) {
          const data = await toursRes.json();
          setSavedTours(data.tours);
        }
      } catch (error) {
        console.error("Failed to fetch saved items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedItems();
  }, [navigate]);

  const repairMetadata = async (placeId, token) => {
     try {
       const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
       const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
       
       const gRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=displayName,primaryType,rating,photos`, {
         headers: { "X-Goog-Api-Key": GOOGLE_API_KEY }
       });
       
       if (gRes.ok) {
         const data = await gRes.json();
         const photoUrl = data.photos && data.photos.length > 0 
           ? `https://places.googleapis.com/v1/${data.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_API_KEY}`
           : null;
           
         const updatedMetadata = {
           place_name: data.displayName?.text || "Amazing Place",
           category: data.primaryType?.replace(/_/g, " ").toUpperCase() || "ATTRACTION",
           rating: data.rating || 4.5,
           photo_url: photoUrl
         };
         
         // Update DB
         await fetch(`${API_BASE}/places/save/${placeId}`, {
           method: "PUT",
           headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
           body: JSON.stringify(updatedMetadata)
         });
         
         // Update local state
         setSavedPlaces(prev => prev.map(p => 
           p.id === placeId ? { ...p, name: updatedMetadata.place_name, category: updatedMetadata.category, rating: updatedMetadata.rating, photo_url: updatedMetadata.photo_url } : p
         ));
       }
     } catch (err) {
       console.error("Failed to repair metadata for", placeId, err);
     }
  };

  const confirmUnsave = async () => {
    const placeId = unsavingId;
    setUnsavingId(null);
    const token = sessionStorage.getItem("token");
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/places/save/${placeId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setSavedPlaces(savedPlaces.filter(p => p.id !== placeId));
        showToast("Removed from saved places", "info");
      }
    } catch (err) {
      showToast("Failed to remove place", "error");
    }
  };

  const getCategoryIcon = (category) => {
    if (category?.includes('Restaurant')) return UtensilsCrossed;
    if (category?.includes('Park')) return Trees;
    if (category?.includes('Historical')) return Landmark;
    if (category?.includes('Museum')) return Landmark;
    if (category?.includes('Hotel') || category?.includes('Lodging')) return Hotel;
    if (category?.includes('Sports')) return Volleyball;
    if (category?.includes('Attraction')) return Camera;
    return MapPin;
  };

  const colors = ['bg-sky-500', 'bg-teal-500', 'bg-slate-200', 'bg-amber-400', 'bg-rose-400'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-['Inter',sans-serif] pb-28 transition-colors duration-300">
      {/* Custom unsave confirm modal */}
      {unsavingId && (
        <ConfirmModal
          message="Remove from saved places?"
          onConfirm={confirmUnsave}
          onCancel={() => setUnsavingId(null)}
        />
      )}

      {/* Header */}
      <header className="bg-slate-900 dark:bg-slate-950 pt-12 pb-8 px-6 rounded-b-[2.5rem] shadow-lg relative transition-colors">
        <button onClick={() => navigate("/dashboard")}
          className="absolute top-12 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition backdrop-blur-sm shadow-sm text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="text-center text-white mt-4 mb-2">
          <h1 className="font-['Playfair_Display',serif] text-[2rem] leading-tight font-bold tracking-tight">{t('saved.title')}</h1>
          <p className="text-amber-500 text-sm mt-2 font-medium tracking-wide uppercase">{t('saved.your_collection', 'Your Collection')}</p>
          {!loading && (
            <div className="mt-3 inline-flex items-center px-4 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold tracking-wide">
              {activeTab === "places" 
                ? `${savedPlaces.length} ${savedPlaces.length === 1 ? "place" : "places"} saved`
                : `${savedTours.length} ${savedTours.length === 1 ? "trip" : "trips"} saved`
              }
            </div>
          )}
        </div>

        {/* Tab Toggle */}
        <div className="mx-6 mt-4 bg-white/10 p-1 rounded-2xl flex relative z-10">
          <button 
            onClick={() => setActiveTab("places")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "places" ? "bg-white text-slate-900 shadow-md" : "text-white/70 hover:text-white"}`}
          >
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Places</span>
          </button>
          <button 
            onClick={() => setActiveTab("trips")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "trips" ? "bg-white text-slate-900 shadow-md" : "text-white/70 hover:text-white"}`}
          >
            <span className="inline-flex items-center gap-1.5"><Map className="w-4 h-4" /> Trips</span>
          </button>
        </div>
      </header>

      <main className="px-6 mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="h-28 skeleton" />
                <div className="p-3 space-y-2">
                  <div className="skeleton h-3 rounded-full w-3/4" />
                  <div className="skeleton h-2.5 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "places" ? (
          savedPlaces.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
              <Compass className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-slate-500 dark:text-gray-400 font-medium transition-colors">{t('saved.no_saved')}</p>
              <button onClick={() => navigate("/dashboard")}
                className="mt-6 bg-slate-900 dark:bg-slate-800 text-white px-6 py-2.5 rounded-2xl font-semibold hover:bg-indigo-600 transition-colors">
                {t('saved.explore_btn')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {savedPlaces.map((place, idx) => {
                const colors = ['bg-sky-500', 'bg-teal-500', 'bg-slate-200', 'bg-amber-400', 'bg-rose-400'];
                // Use a simple hash for string IDs to pick a consistent color
                const idHash = typeof place.id === 'string' 
                  ? place.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) 
                  : place.id;
                const bgColor = colors[idHash % colors.length];
                return (
                  <div key={place.id}
                    onClick={() => navigate(`/places/${place.id}`)}
                    className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 dark:border-slate-700 active:scale-95"
                    style={{ animation: `fadeInUp 0.4s ease-out ${idx * 0.06}s both` }}
                  >
                    <div 
                      className={`h-28 flex items-center justify-center relative bg-cover bg-center ${!place.photo_url ? bgColor : ''}`}
                      style={place.photo_url ? { backgroundImage: `url(${place.photo_url})` } : {}}
                    >
                      <div onClick={(e) => { e.stopPropagation(); setUnsavingId(place.id); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-white/80 dark:bg-slate-950/60 backdrop-blur-sm rounded-full flex items-center justify-center text-indigo-600 hover:bg-white transition-colors shadow-sm z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                      </div>
                      {place.photo_url && (
                        <div className="absolute inset-0 bg-slate-950/20" />
                      )}
                      {!place.photo_url && (() => { const Icon = getCategoryIcon(place.category); return <Icon className="w-12 h-12 text-white/90 drop-shadow-md" />; })()}
                    </div>
                    <div className="p-4 pt-3">
                      <h3 className="font-['Playfair_Display',serif] text-sm font-bold text-slate-900 dark:text-white transition-colors truncate block leading-tight">
                        {place.name || "Amazing Place"}
                      </h3>
                      <div className="flex items-center space-x-1 mt-1 text-[11px] font-bold text-slate-500">
                        {(() => { const Icon = getCategoryIcon(place.category); return <Icon className="w-3.5 h-3.5" />; })()}
                        <span className="truncate">
                          {(() => {
                            const cat = (place.category || 'Attraction').toLowerCase();
                            const rawCat = t(`dashboard.cat_${cat}`, place.category || 'Attraction');
                            return rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Trips Tab */
          savedTours.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-slate-500 dark:text-gray-400 font-medium transition-colors">No saved trips yet!</p>
              <button onClick={() => navigate("/dashboard")}
                className="mt-6 bg-slate-900 dark:bg-slate-800 text-white px-6 py-2.5 rounded-2xl font-semibold hover:bg-indigo-600 transition-colors">
                Generate a Tour
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedTours.map((tour, idx) => (
                <div key={tour.id}
                  onClick={() => navigate("/tour-results", { state: { destination: tour.destination, cachedTour: tour.itinerary } })}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all active:scale-[0.98]"
                  style={{ animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s both` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-['Playfair_Display',serif] text-xl font-bold text-slate-900 dark:text-white">{tour.title}</h3>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-600/10 px-2 py-0.5 rounded-md">Saved Trip</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-slate-500 font-medium">
                     <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {tour.destination}</span>
                     <span>•</span>
                     <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {new Date(tour.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default SavedPlaces;
