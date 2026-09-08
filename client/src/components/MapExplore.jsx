import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useTranslation } from "react-i18next";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from "../hooks/useTheme";
import { Landmark, UtensilsCrossed, Hotel, Trees, MapPin, Search, Globe, Star } from "lucide-react";

// Zoom control component to link custom buttons to map
const CustomZoomControl = ({ zoomIn, zoomOut }) => {
  const map = useMap();
  useEffect(() => {
    if (zoomIn) map.zoomIn();
    if (zoomOut) map.zoomOut();
  }, [zoomIn, zoomOut, map]);
  return null;
};

const MapExplore = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerZoomIn, setTriggerZoomIn] = useState(0);
  const [triggerZoomOut, setTriggerZoomOut] = useState(0);

  const [userLocation, setUserLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const { isDarkMode } = useTheme();

  // Center of the world
  const defaultPosition = [48.8566, 2.3522]; // Paris default

  useEffect(() => {
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

    // Beyond this radius of uncertainty (meters), the coordinates are no more
    // trustworthy than an IP guess and shouldn't be presented as precise location.
    const LOW_ACCURACY_THRESHOLD_METERS = 10000;

    const applyPosition = (position) => {
      const accuracy = position.coords.accuracy;
      console.info(`Map geolocation accuracy: ~${Math.round(accuracy)}m`);
      setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      if (accuracy > LOW_ACCURACY_THRESHOLD_METERS) {
        setGeoError(`Low location accuracy (~${(accuracy / 1000).toFixed(1)}km radius) — likely from mobile data/hotspot with no Wi-Fi to triangulate against. Results may not match your exact area.`);
      } else {
        setGeoError(null);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        applyPosition,
        (err) => {
          const reason = describeGeoError(err);
          console.warn("Map high-accuracy geolocation failed:", reason);
          navigator.geolocation.getCurrentPosition(
            applyPosition,
            async (errCoarse) => {
              const coarseReason = describeGeoError(errCoarse);
              console.warn("Map low-accuracy geolocation failed:", coarseReason);
              try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                if (typeof data.latitude === "number" && typeof data.longitude === "number") {
                  setUserLocation({ lat: data.latitude, lng: data.longitude });
                  setGeoError(`${coarseReason} Showing spots near your estimated city (IP-based, may be inaccurate).`);
                } else {
                  setUserLocation({ lat: defaultPosition[0], lng: defaultPosition[1] });
                  setGeoError(`${coarseReason} IP lookup also failed. Showing default location.`);
                }
              } catch (e) {
                setUserLocation({ lat: defaultPosition[0], lng: defaultPosition[1] });
                setGeoError(`${coarseReason} IP lookup also failed (${e.message}). Showing default location.`);
              }
            },
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
          );
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 300000 }
      );
    } else {
      setGeoError("Geolocation not supported by this browser. Showing default location.");
      setUserLocation({ lat: defaultPosition[0], lng: defaultPosition[1] });
    }
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    const fetchLivePlaces = async () => {
      try {
        setLoading(true);
        const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        if (!apiKey) throw new Error("No Google Places API key found");

        const requestBody = {
          includedTypes: ["tourist_attraction", "museum", "restaurant", "park", "lodging"],
          maxResultCount: 20,
          languageCode: i18n.language || "en",
          locationRestriction: {
            circle: {
              center: {
                latitude: userLocation.lat,
                longitude: userLocation.lng,
              },
              radius: 5000.0, // 5km
            },
          },
        };

        const response = await fetch(
          "https://places.googleapis.com/v1/places:searchNearby",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": "places.name,places.id,places.location,places.primaryType,places.rating,places.displayName,places.photos",
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
           throw new Error("Failed to fetch fresh places from Google API");
        }
        
        const data = await response.json();
        
        const mappedPlaces = (data.places || []).map(p => {
           const photo = p.photos && p.photos.length > 0 ? p.photos[0].name : null;
           return {
             id: p.name.split("/").pop() || p.id,
             name: p.displayName?.text || p.name,
             latitude: p.location.latitude,
             longitude: p.location.longitude,
             category: p.primaryType || 'attraction',
             rating: p.rating || 4.5,
             photoUrl: photo ? `https://places.googleapis.com/v1/${photo}/media?maxHeightPx=100&maxWidthPx=100&key=${apiKey}` : null
           };
        });

        setPlaces(mappedPlaces);
      } catch (err) {
        console.error("Failed to fetch Google Places for map", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLivePlaces();
  }, [userLocation]);

  const getMarkerColor = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('museum') || cat.includes('historical') || cat.includes('attraction')) return '#f26a4f'; // Orange/Red
    if (cat.includes('kitchen') || cat.includes('restaurant') || cat.includes('lodging') || cat.includes('hotel')) return '#e9c46a'; // Yellow
    if (cat.includes('garden') || cat.includes('park')) return '#2a9d8f'; // Green
    return '#e76f51'; // Default Orange
  };

  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('museum') || cat.includes('historical') || cat.includes('attraction')) return Landmark;
    if (cat.includes('kitchen') || cat.includes('restaurant')) return UtensilsCrossed;
    if (cat.includes('hotel') || cat.includes('lodging')) return Hotel;
    if (cat.includes('garden') || cat.includes('park')) return Trees;
    return MapPin;
  };

  // Raw SVG markup for the star used inside Leaflet's HTML-string marker labels
  // (Leaflet DivIcon takes plain HTML, not React elements, so icons here are inlined as SVG strings).
  const STAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="display:inline;vertical-align:-1px;margin-right:2px;"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>';

  // Create custom HTML markers for each place
  const createCustomIcon = (place) => {
    const color = getMarkerColor(place.category);
    // Determine what to show in label (name + optional rating)
    let label = place.category?.includes('Kitchen') ? `${place.name} ${STAR_SVG}${place.rating || "4.9"}` : place.name;
    
    // We create a glowing HTML string for the Leaflet DivIcon
    const htmlString = `
      <div style="position:relative; display:flex; flex-direction:column; items:center; align-items:center;">
        <div style="
          background-color: ${color}; 
          color: white; 
          padding: 4px 12px; 
          border-radius: 12px; 
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: 11px;
          white-space: nowrap;
          box-shadow: 0 0 15px ${color}80;
          margin-bottom: 6px;
        ">${label}</div>
        <div style="
          width: 8px; 
          height: 8px; 
          background-color: ${color}; 
          border-radius: 50%;
        "></div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-div-icon',
      html: htmlString,
      iconSize: [120, 40],
      iconAnchor: [60, 40] // Anchor at the bottom center of the dot
    });
  };

  const filteredPlaces = places.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 font-['Inter',sans-serif] relative flex flex-col overflow-hidden transition-colors">
      <style>{`
        .dark-map-tiles .leaflet-tile-pane {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}</style>
      
      {/* Top Search Bar & Controls */}
      <div className="absolute top-0 left-0 right-0 z-1000 p-6 pt-12 flex justify-between items-start pointer-events-none">
        
        {/* Back Button & Search */}
        <div className="flex w-full space-x-3 pointer-events-auto mr-4">
           <button 
             onClick={() => navigate("/dashboard")}
             className="w-12 h-12 shrink-0 bg-[#e8e6e1] dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white shadow-sm transform hover:scale-105 transition-all"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
             </svg>
           </button>
           
           <div className="flex-1 bg-[#e8e6e1] dark:bg-slate-900 rounded-2xl flex items-center px-4 shadow-sm h-12 transition-colors">
             <Search className="w-4 h-4 text-slate-500 mr-2" />
             <input 
               type="text" 
               placeholder={t('map.search')} 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white font-semibold placeholder-[#a0978c] dark:placeholder-gray-400 transition-colors"
             />
           </div>
        </div>

        {/* Floating Right Controls */}
        <div className="flex flex-col space-y-3 pointer-events-auto shrink-0">
          <button onClick={() => setTriggerZoomIn(prev => prev + 1)} className="w-12 h-12 bg-[#e8e6e1] dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-bold text-xl shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors">+</button>
          <button onClick={() => setTriggerZoomOut(prev => prev + 1)} className="w-12 h-12 bg-[#e8e6e1] dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-bold text-2xl pb-1 shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors">-</button>
          <button className="w-12 h-12 bg-[#e8e6e1] dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"><MapPin className="w-5 h-5 text-slate-900 dark:text-white" /></button>
        </div>
      </div>

      {geoError && (
        <div className="absolute top-28 left-6 right-6 z-1000 pointer-events-none">
          <p className="bg-[#e8e6e1] dark:bg-slate-900 text-indigo-600 text-xs font-semibold rounded-2xl px-4 py-2 shadow-sm inline-block pointer-events-auto">
            {geoError}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Globe className="w-16 h-16 text-slate-400 animate-pulse" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0">
          {userLocation ? (
            <MapContainer 
              center={[userLocation.lat, userLocation.lng]} 
              zoom={14} 
              className={`w-full h-full ${isDarkMode ? 'dark-map-tiles' : ''}`}
              zoomControl={false}
            >
              <CustomZoomControl zoomIn={triggerZoomIn} zoomOut={triggerZoomOut} />
              {/* Dynamic map tiles to match theme using Voyager structure */}
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CartoDB</a> | <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url={
                  isDarkMode 
                    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                }
              />
              
              {/* User Location Pulse */}
              <Marker position={[userLocation.lat, userLocation.lng]} icon={L.divIcon({
                className: 'custom-user-icon',
                html: `<div style="width:20px; height:20px; background-color:#3a86ff; border:3px solid #1a202c; border-radius:50%; box-shadow: 0 0 0 3px rgba(58, 134, 255, 0.3);"></div>`,
                iconSize: [20,20], iconAnchor: [10,10],
                zIndexOffset: 1000
              })} />

            {filteredPlaces.map((place) => {
              if(!place.latitude || !place.longitude) return null;
              return (
                <Marker 
                  key={place.id} 
                  position={[place.latitude, place.longitude]}
                  icon={createCustomIcon(place)}
                  eventHandlers={{
                    click: () => navigate(`/places/${place.id}`)
                  }}
                />
              )
            })}
            </MapContainer>
          ) : null}
        </div>
      )}

      {/* Bottom Sheet Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#f9f6f0] dark:bg-slate-950 h-[40vh] rounded-t-[2.5rem] z-2000 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col transition-colors duration-300">
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-[#dcd7ce] dark:bg-slate-700 rounded-full transition-colors"></div>
        </div>

        <div className="px-6 flex-1 overflow-y-auto pb-8">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-gray-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 mt-2 transition-colors">
            <span>{t('map.nearby')}</span>
            <span>—</span>
            <span>{filteredPlaces.length} {t('map.places_found')}</span>
          </div>

          <div className="space-y-4">
            {filteredPlaces.map((place, idx) => (
              <div 
                key={place.id} 
                onClick={() => navigate(`/places/${place.id}`)}
                className="bg-slate-100 dark:bg-slate-900 rounded-3xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#e8e4d9] dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 bg-[#e2dcd0] dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner transition-colors bg-cover bg-center shrink-0 overflow-hidden"
                    style={place.photoUrl ? { backgroundImage: `url(${place.photoUrl})` } : {}}
                  >
                    {!place.photoUrl && (() => { const Icon = getCategoryIcon(place.category); return <Icon className="w-6 h-6 text-slate-500 dark:text-gray-400" />; })()}
                  </div>
                  <div>
                    <h3 className="font-['Playfair_Display',serif] text-lg font-bold text-slate-900 dark:text-white leading-tight mb-0.5 transition-colors">{place.name}</h3>
                    <div className="flex items-center text-[#9c9387] dark:text-gray-400 text-xs font-semibold transition-colors">
                      <Star className="w-3 h-3 text-slate-500 dark:text-gray-500 mr-1" fill="currentColor" /> {place.rating || "4.5"}
                      <span className="mx-1.5">•</span> 
                      {place.category}
                    </div>
                  </div>
                </div>
                <div className ="text-indigo-600 font-bold text-sm">
                   {/* Dummy distance calculation based on index for aesthetic match */}
                   {((idx * 0.3) + 0.5).toFixed(1)} km
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapExplore;
