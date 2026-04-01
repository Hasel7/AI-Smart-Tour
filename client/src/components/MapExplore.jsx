import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerZoomIn, setTriggerZoomIn] = useState(0);
  const [triggerZoomOut, setTriggerZoomOut] = useState(0);

  // Center of the world
  const defaultPosition = [48.8566, 2.3522]; // Paris default

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_BASE}/places`);
        if (response.ok) {
          const data = await response.json();
          const validPlaces = data.places.filter(p => p.latitude && p.longitude);
          setPlaces(validPlaces);
        }
      } catch (err) {
        console.error("Failed to fetch places for map", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  const getMarkerColor = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('museum') || cat.includes('historical')) return '#f26a4f'; // Orange/Red
    if (cat.includes('kitchen') || cat.includes('restaurant') || cat.includes('hotel')) return '#e9c46a'; // Yellow
    if (cat.includes('garden') || cat.includes('park')) return '#2a9d8f'; // Green
    return '#e76f51'; // Default Orange
  };

  const getEmoji = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('museum') || cat.includes('historical')) return '🏛️'; 
    if (cat.includes('kitchen') || cat.includes('restaurant')) return '🍽️';
    if (cat.includes('hotel')) return '🏨';
    if (cat.includes('garden') || cat.includes('park')) return '🌳';
    return '📍';
  };

  // Create custom HTML markers for each place
  const createCustomIcon = (place) => {
    const color = getMarkerColor(place.category);
    // Determine what to show in label (name + optional rating)
    let label = place.category?.includes('Kitchen') ? `${place.name} ★${place.rating || "4.9"}` : place.name;
    
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
    <div className="h-screen w-full bg-[#1e231f] font-['Inter',sans-serif] relative flex flex-col overflow-hidden">
      
      {/* Top Search Bar & Controls */}
      <div className="absolute top-0 left-0 right-0 z-1000 p-6 pt-12 flex justify-between items-start pointer-events-none">
        
        {/* Back Button & Search */}
        <div className="flex w-full space-x-3 pointer-events-auto mr-4">
           <button 
             onClick={() => navigate("/dashboard")}
             className="w-12 h-12 shrink-0 bg-[#e8e6e1] rounded-2xl flex items-center justify-center text-[#2f2722] shadow-sm transform hover:scale-105 transition-transform"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
             </svg>
           </button>
           
           <div className="flex-1 bg-[#e8e6e1] rounded-2xl flex items-center px-4 shadow-sm h-12">
             <span className="text-[#a0978c] text-lg mr-2">🔍</span>
             <input 
               type="text" 
               placeholder="Search on map..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="bg-transparent border-none outline-none w-full text-[#2f2722] font-semibold placeholder-[#a0978c]"
             />
           </div>
        </div>

        {/* Floating Right Controls */}
        <div className="flex flex-col space-y-3 pointer-events-auto shrink-0">
          <button onClick={() => setTriggerZoomIn(prev => prev + 1)} className="w-12 h-12 bg-[#e8e6e1] rounded-2xl flex items-center justify-center text-[#2f2722] font-bold text-xl shadow-sm hover:bg-white transition-colors">+</button>
          <button onClick={() => setTriggerZoomOut(prev => prev + 1)} className="w-12 h-12 bg-[#e8e6e1] rounded-2xl flex items-center justify-center text-[#2f2722] font-bold text-2xl pb-1 shadow-sm hover:bg-white transition-colors">-</button>
          <button className="w-12 h-12 bg-[#e8e6e1] rounded-2xl flex items-center justify-center text-xl shadow-sm hover:bg-white transition-colors">📍</button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 h-full flex items-center justify-center bg-[#1e231f]">
          <span className="text-6xl animate-pulse">🌍</span>
        </div>
      ) : (
        <div className="absolute inset-0 z-0">
          <MapContainer 
            center={places.length > 0 ? [places[0].latitude, places[0].longitude] : defaultPosition} 
            zoom={13} 
            className="w-full h-full"
            zoomControl={false}
          >
            <CustomZoomControl zoomIn={triggerZoomIn} zoomOut={triggerZoomOut} />
            {/* Dark map tiles to match screenshot */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* User Location Pulse (Dummy Center) */}
            {places.length > 0 && (
              <Marker position={[places[0].latitude - 0.005, places[0].longitude - 0.005]} icon={L.divIcon({
                className: 'custom-user-icon',
                html: `<div style="width:20px; height:20px; background-color:#3a86ff; border:3px solid #1a202c; border-radius:50%; box-shadow: 0 0 0 3px rgba(58, 134, 255, 0.3);"></div>`,
                iconSize: [20,20], iconAnchor: [10,10]
              })} />
            )}

            {filteredPlaces.map((place) => (
              <Marker 
                key={place.id} 
                position={[place.latitude, place.longitude]}
                icon={createCustomIcon(place)}
                eventHandlers={{
                  click: () => navigate(`/places/${place.id}`)
                }}
              />
            ))}
          </MapContainer>
        </div>
      )}

      {/* Bottom Sheet Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#f9f6f0] h-[40vh] rounded-t-[2.5rem] z-2000 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col">
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-[#dcd7ce] rounded-full"></div>
        </div>

        <div className="px-6 flex-1 overflow-y-auto pb-8">
          <div className="flex items-center space-x-2 text-[#a0978c] text-[10px] font-bold tracking-[0.2em] uppercase mb-4 mt-2">
            <span>NEARBY</span>
            <span>—</span>
            <span>{filteredPlaces.length} PLACES FOUND</span>
          </div>

          <div className="space-y-4">
            {filteredPlaces.map((place, idx) => (
              <div 
                key={place.id} 
                onClick={() => navigate(`/places/${place.id}`)}
                className="bg-[#f0ece1] rounded-1.5rem p-4 flex items-center justify-between cursor-pointer hover:bg-[#e8e4d9] transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#e2dcd0] rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                    {getEmoji(place.category)}
                  </div>
                  <div>
                    <h3 className="font-['Playfair_Display',serif] text-lg font-bold text-[#2f2722] leading-tight mb-0.5">{place.name}</h3>
                    <div className="flex items-center text-[#9c9387] text-xs font-semibold">
                      <span className="text-[#a0978c] mr-1">★</span> {place.rating || "4.5"} 
                      <span className="mx-1.5">•</span> 
                      {place.category}
                    </div>
                  </div>
                </div>
                <div className ="text-[#c85a3c] font-bold text-sm">
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
