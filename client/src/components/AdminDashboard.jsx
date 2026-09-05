import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "./Toast";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const showToast = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState({ users: 0, places: 0, reviews: 0 });
    const [users, setUsers] = useState([]);
    const [places, setPlaces] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPlaceModal, setShowPlaceModal] = useState(false);
    const [editingPlace, setEditingPlace] = useState(null);
    const [placeForm, setPlaceForm] = useState({
        name: "", description: "", category: "Attraction", latitude: 0, longitude: 0, photo_url: "", rating: 4.5
    });
    const [googleSearchQuery, setGoogleSearchQuery] = useState("");
    const [googleResults, setGoogleResults] = useState([]);
    const [searchingGoogle, setSearchingGoogle] = useState(false);
    const [viewMode, setViewMode] = useState("local"); // 'local' or 'google'

    const checkAdmin = () => {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        if (user.role !== "admin") {
            navigate("/dashboard");
            showToast("Unauthorized access", "error");
        }
    };

    useEffect(() => {
        checkAdmin();
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        const token = sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (activeTab === "overview" || activeTab === "users") {
                const res = await api.get("/admin/users", { headers });
                setUsers(res.data.users);
            }
            if (activeTab === "overview" || activeTab === "destinations") {
                const res = await api.get("/places");
                setPlaces(res.data.places);
            }
            if (activeTab === "overview" || activeTab === "reviews") {
                const res = await api.get("/admin/reviews", { headers });
                setReviews(res.data.reviews);
            }

            // Update stats
            if (activeTab === "overview") {
                setStats({
                    users: users.length,
                    places: places.length,
                    reviews: reviews.length
                });
            }
        } catch (err) {
            console.error("Fetch data error:", err);
            showToast("Failed to fetch admin data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/admin/users/${id}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } });
            setUsers(users.filter(u => u.id !== id));
            showToast("User deleted", "success");
        } catch (err) {
            showToast("Delete failed", "error");
        }
    };

    const handleDeleteReview = async (id) => {
        if (!window.confirm("Delete this review?")) return;
        try {
            await api.delete(`/admin/reviews/${id}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } });
            setReviews(reviews.filter(r => r.id !== id));
            showToast("Review removed", "success");
        } catch (err) {
            showToast("Delete failed", "error");
        }
    };

    const handleOpenPlaceModal = (place = null) => {
        if (place) {
            setEditingPlace(place);
            setPlaceForm(place);
        } else {
            setEditingPlace(null);
            setPlaceForm({ name: "", description: "", category: "Attraction", latitude: 0, longitude: 0, photo_url: "", rating: 4.5 });
        }
        setShowPlaceModal(true);
    };

    const handleSavePlace = async (e) => {
        e.preventDefault();
        const token = sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        try {
            if (editingPlace) {
                await api.put(`/admin/places/${editingPlace.id}`, placeForm, { headers });
                showToast("Destination updated", "success");
            } else {
                await api.post(`/admin/places`, placeForm, { headers });
                showToast("Destination added", "success");
            }
            setShowPlaceModal(false);
            fetchData();
        } catch (err) {
            showToast("Failed to save destination", "error");
        }
    };

    const handleDeletePlace = async (id) => {
        if (!window.confirm("Delete this destination?")) return;
        try {
            await api.delete(`/admin/places/${id}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } });
            setPlaces(places.filter(p => p.id !== id));
            showToast("Destination deleted", "success");
        } catch (err) {
            showToast("Delete failed", "error");
        }
    };

    const handleGoogleSearch = async (e) => {
        e.preventDefault();
        if (!googleSearchQuery.trim()) return;
        setSearchingGoogle(true);
        const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        try {
            const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
                method: "POST",
                headers: {
                    "X-Goog-Api-Key": GOOGLE_API_KEY,
                    "X-Goog-FieldMask": "places.displayName,places.location,places.primaryType,places.formattedAddress,places.id,places.rating,places.editorialSummary,places.types,places.photos",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    textQuery: googleSearchQuery,
                    maxResultCount: 10
                })
            });
            const data = await response.json();
            if (data.places) {
                setGoogleResults(data.places.map(p => ({
                    id: p.id,
                    name: p.displayName?.text,
                    description: p.editorialSummary?.text || p.formattedAddress,
                    category: p.primaryType || p.types?.[0] || "Attraction",
                    latitude: p.location?.latitude,
                    longitude: p.location?.longitude,
                    rating: p.rating || 4.5,
                    photo_url: p.photos?.[0]?.name ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_API_KEY}` : ""
                })));
            } else {
                setGoogleResults([]);
                showToast("No results found", "info");
            }
        } catch (err) {
            showToast("Google search failed", "error");
        } finally {
            setSearchingGoogle(false);
        }
    };

    const handleImportPlace = (p) => {
        setPlaceForm({
            name: p.name,
            description: p.description,
            category: mapGoogleCategory(p.category),
            latitude: p.latitude,
            longitude: p.longitude,
            rating: p.rating,
            photo_url: p.photo_url
        });
        setEditingPlace(null);
        setShowPlaceModal(true);
    };

    const mapGoogleCategory = (cat) => {
        const c = cat.toLowerCase();
        if (c.includes("restaurant") || c.includes("food")) return "Restaurant";
        if (c.includes("museum") || c.includes("art")) return "Museum";
        if (c.includes("historic")) return "Historical";
        if (c.includes("park") || c.includes("nature")) return "Nature";
        if (c.includes("hotel") || c.includes("lodging")) return "Hotel";
        if (c.includes("stadium") || c.includes("sport")) return "Sports";
        return "Attraction";
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Inter',sans-serif] text-slate-900 dark:text-white pb-10">
            {/* Header */}
            <header className="bg-slate-900 dark:bg-slate-950 p-8 pt-12 pb-16 rounded-b-[3rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <button 
                    onClick={() => navigate("/profile")} 
                    className="absolute top-12 left-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-90 z-50 cursor-pointer shadow-lg"
                    aria-label="Back to Profile"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <div className="text-center relative z-10">
                    <h1 className="font-['Playfair_Display',serif] text-3xl font-bold text-white mb-2">Admin Control</h1>
                    <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em]">Management Suite v1.0</p>
                </div>
            </header>

            {/* Nav Tabs */}
            <nav className="flex px-6 -mt-8 relative z-20 space-x-2">
                {["overview", "users", "destinations", "reviews"].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3.5 rounded-2xl text-xs font-bold capitalize transition-all shadow-lg ${activeTab === tab ? "bg-indigo-600 text-white scale-105" : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100"}`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            <main className="px-6 mt-8">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-[#4f46e5] rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activeTab === "overview" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <span className="text-2xl block mb-2">👥</span>
                                    <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Total Users</h4>
                                    <p className="text-3xl font-bold font-['Playfair_Display',serif]">{users.length}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <span className="text-2xl block mb-2">📸</span>
                                    <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Places</h4>
                                    <p className="text-3xl font-bold font-['Playfair_Display',serif]">{places.length}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === "users" && (
                            <div className="bg-white dark:bg-slate-900 rounded-4xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                                    <h3 className="font-bold text-lg">Platform Users</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-[#161616] text-slate-500">
                                                <th className="px-6 py-4 font-bold">Name</th>
                                                <th className="px-6 py-4 font-bold">Role</th>
                                                <th className="px-6 py-4 font-bold">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#f0ece1] dark:divide-[#333]">
                                            {users.map(u => (
                                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold">{u.full_name}</div>
                                                        <div className="text-[10px] text-slate-500">{u.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div className="space-y-4">
                                {reviews.map(r => (
                                    <div key={r.id} className="bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-indigo-600">{r.user_name}</h4>
                                                <p className="text-[10px] text-slate-500">on <span className="font-bold">{r.place_name || 'External Destination'}</span></p>
                                            </div>
                                            <button onClick={() => handleDeleteReview(r.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                            </button>
                                        </div>
                                        <div className="flex mb-2">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <span key={i} className={i < r.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-900 dark:text-gray-300 italic">"{r.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === "destinations" && (
                            <div className="space-y-6">
                                {/* Toggle & Search */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl flex border border-slate-100 dark:border-slate-700 shadow-sm flex-1">
                                        <button onClick={() => setViewMode("local")} className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${viewMode === "local" ? "bg-indigo-600 text-white" : "text-slate-500"}`}>Platform Spots</button>
                                        <button onClick={() => setViewMode("google")} className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${viewMode === "google" ? "bg-slate-950 text-amber-500" : "text-slate-500"}`}>Google Search</button>
                                    </div>
                                    <button onClick={() => handleOpenPlaceModal()} className="py-4 px-8 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all">
                                        + Manual Add
                                    </button>
                                </div>

                                {viewMode === "google" && (
                                    <form onSubmit={handleGoogleSearch} className="relative group">
                                        <input 
                                            type="text" 
                                            value={googleSearchQuery}
                                            onChange={e => setGoogleSearchQuery(e.target.value)}
                                            placeholder="Search world destinations via Google..." 
                                            className="w-full bg-white dark:bg-slate-900 p-5 pr-16 rounded-4xl border border-slate-100 dark:border-slate-700 shadow-md outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium text-sm"
                                        />
                                        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950 text-amber-500 rounded-full flex items-center justify-center shadow-lg transition-transform group-focus-within:scale-110">
                                            {searchingGoogle ? <div className="w-4 h-4 border-2 border-amber-500/20 border-t-[#dcb35f] rounded-full animate-spin"></div> : "🔍"}
                                        </button>
                                    </form>
                                )}

                                <div className="space-y-4">
                                    {viewMode === "local" ? (
                                        places.map(p => (
                                            <div key={p.id} 
                                                onClick={() => handleOpenPlaceModal(p)}
                                                className="bg-white dark:bg-slate-900 p-5 rounded-4xl border border-slate-100 dark:border-slate-700 flex items-center space-x-4 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                                            >
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl">📍</div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-sm">{p.name}</h4>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{p.category}</p>
                                                </div>
                                                <div className="text-red-500" onClick={(e) => { e.stopPropagation(); handleDeletePlace(p.id); }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        googleResults.map(p => (
                                            <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-4xl border border-slate-100 dark:border-slate-700 flex items-center space-x-4 shadow-sm hover:border-amber-500 transition-all">
                                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                                                    {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" /> : "🗺️"}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-sm leading-tight mb-0.5">{p.name}</h4>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase tracking-wider">{p.category}</span>
                                                        <span className="text-[10px] text-yellow-500">★ {p.rating}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleImportPlace(p)} className="px-4 py-2 bg-slate-950 text-amber-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                                    Import
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Place Modal */}
            {showPlaceModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-100 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl max-w-lg w-full border border-white/20 my-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-['Playfair_Display',serif] text-2xl font-bold">{editingPlace ? "Edit Spot" : "Add New Spot"}</h3>
                            <button onClick={() => setShowPlaceModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSavePlace} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Spot Name</label>
                                    <input type="text" value={placeForm.name} onChange={e => setPlaceForm({...placeForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-600" required />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Description</label>
                                    <textarea value={placeForm.description} onChange={e => setPlaceForm({...placeForm, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-600 h-24" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Category</label>
                                    <select value={placeForm.category} onChange={e => setPlaceForm({...placeForm, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-600">
                                        <option>Attraction</option>
                                        <option>Restaurant</option>
                                        <option>Museum</option>
                                        <option>Historical</option>
                                        <option>Nature</option>
                                        <option>Hotel</option>
                                        <option>Sports</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Rating (1-5)</label>
                                    <input type="number" step="0.1" min="1" max="5" value={placeForm.rating} onChange={e => setPlaceForm({...placeForm, rating: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-600" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-800 transition-all mt-4">
                                {editingPlace ? "Update Destination" : "Add to Platform"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
