import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "./Toast";

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
    <div className="glass-panel rounded-3xl p-6 max-w-sm w-full border-none shadow-2xl"
      style={{ animation: "fadeInUp 0.25s ease-out both" }}>
      <p className="font-sans text-slate-900 dark:text-white font-semibold mb-6 text-center">{message}</p>
      <div className="flex space-x-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-800 transition-colors">Confirm</button>
      </div>
    </div>
  </div>
);

const PlaceDetails = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || 'null');
  const loggedInUserId = currentUser?.id;

  useEffect(() => {
    const fetchPlaceAndReviews = async () => {
      try {
        setLoading(true);
        const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        let googlePlaceData = null;

        if (id.length > 10) {
          const gRes = await fetch(`https://places.googleapis.com/v1/places/${id}?languageCode=${i18n.language || "en"}`, {
            headers: {
              "X-Goog-Api-Key": GOOGLE_API_KEY,
              "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,editorialSummary,primaryType,photos,nationalPhoneNumber,websiteUri,regularOpeningHours,googleMapsUri"
            }
          });
          if (gRes.ok) {
            const data = await gRes.json();
            const photoUrls = (data.photos || []).slice(0, 10).map(p =>
              `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_API_KEY}`
            );
            googlePlaceData = {
              id: data.id,
              name: data.displayName?.text || "Amazing Place",
              description: data.editorialSummary?.text || data.formattedAddress,
              rating: data.rating,
              category: (data.primaryType?.replace(/_/g, " ").toUpperCase()) || "ATTRACTION",
              photoUrl: photoUrls.length > 0 ? photoUrls[0].replace('400', '800') : null,
              gallery: photoUrls,
              phone: data.nationalPhoneNumber,
              website: data.websiteUri,
              openingHours: data.regularOpeningHours?.weekdayDescriptions,
              googleMapsUri: data.googleMapsUri
            };
          }
        }

        if (googlePlaceData) {
          setPlace(googlePlaceData);
        } else {
          const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
          const placeRes = await fetch(`${API_BASE}/places/${id}`);
          if (placeRes.ok) {
            const placeData = await placeRes.json();
            setPlace(placeData.place);
          } else {
            navigate("/dashboard");
            return;
          }
        }

        // Check if saved
        const token = sessionStorage.getItem("token");
        if (token) {
          const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
          const savedRes = await fetch(`${API_BASE}/places/saved`, { headers: { Authorization: `Bearer ${token}` } });
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            setIsSaved(savedData.saved_places.some(p => p.id === id));
          }
        }

        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const reviewRes = await fetch(`${API_BASE}/places/${id}/reviews`);
        if (reviewRes.ok) {
          const reviewData = await reviewRes.json();
          setReviews(reviewData.reviews || []);
        }
      } catch (err) {
        console.error("Error fetching place details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaceAndReviews();
  }, [id, navigate]);

  const toggleSave = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) { showToast("Please log in to save places!", "error"); return; }
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    try {
      if (isSaved) {
        await fetch(`${API_BASE}/places/save/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setIsSaved(false);
        showToast("Removed from saved places", "info");
      } else {
        await fetch(`${API_BASE}/places/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ 
            place_id: id,
            place_name: place.name,
            category: place.category,
            rating: place.rating,
            photo_url: place.photoUrl
          }),
        });
        setIsSaved(true);
        showToast("Place saved! ♡", "success");
      }
    } catch (err) {
      showToast("Failed to update saved places", "error");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { showToast("Please leave a comment!", "error"); return; }
    const token = sessionStorage.getItem("token");
    if (!token) { showToast("You must be logged in to leave a review.", "error"); return; }
    try {
      setSubmitting(true);
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/places/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment }),
      });
      if (res.ok) {
        setReviews([{ id: Date.now(), rating, comment, user_id: loggedInUserId, full_name: currentUser.full_name || "Me", created_at: new Date().toISOString() }, ...reviews]);
        setComment("");
        setRating(5);
        showToast("Review submitted! Thank you 🌟", "success");
      } else {
        const errorData = await res.json();
        showToast(errorData.message || "Failed to submit review.", "error");
      }
    } catch (err) {
      showToast("Error submitting review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setDeletingReviewId(reviewId);
  };

  const confirmDeleteReview = async () => {
    const reviewId = deletingReviewId;
    setDeletingReviewId(null);
    const token = sessionStorage.getItem("token");
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/places/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
        showToast("Review deleted", "info");
      } else {
        const errorData = await res.json();
        showToast(errorData.message || "Failed to delete review.", "error");
      }
    } catch (err) {
      showToast("Error deleting review", "error");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans space-y-4 transition-colors duration-300">
      {/* Skeleton hero */}
      <div className="w-full max-w-md px-4 space-y-4">
        <div className="h-[280px] skeleton rounded-3xl" />
        <div className="skeleton h-6 rounded-full w-3/4" />
        <div className="skeleton h-4 rounded-full w-1/2" />
        <div className="skeleton h-4 rounded-full w-5/6" />
      </div>
    </div>
  );

  if (!place) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans pb-12 transition-colors duration-300">
      {/* Delete confirmation modal */}
      {deletingReviewId && (
        <ConfirmModal
          message="Are you sure you want to delete this review?"
          onConfirm={confirmDeleteReview}
          onCancel={() => setDeletingReviewId(null)}
        />
      )}

      {/* Hero Header */}
      <div
        className="h-[300px] bg-slate-900 dark:bg-slate-950 text-white pt-10 px-6 relative rounded-b-[2.5rem] shadow-lg flex flex-col justify-end pb-8 transition-colors bg-cover bg-center"
        style={place.photoUrl ? { backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%), url(${place.photoUrl})` } : {}}
      >
        <button onClick={() => navigate(-1)} className="absolute top-10 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition backdrop-blur-sm shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Save FAB */}
        <button
          onClick={toggleSave}
          className={`absolute top-10 right-6 w-11 h-11 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-all ${isSaved ? "bg-indigo-600 text-white scale-110" : "bg-white/20 text-white hover:bg-white/30"}`}
          title={isSaved ? "Unsave" : "Save this place"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        <div className="flex justify-between items-end">
          <div style={{ animation: "fadeInUp 0.4s ease-out both" }}>
            <div className="flex items-center space-x-2 text-amber-500 text-xs font-bold tracking-widest uppercase mb-2">
              <span className="text-sm">
                {(() => {
                  const c = place.category || '';
                  if (c.includes('Restaurant')) return '🍽️';
                  if (c.includes('Park')) return '🌳';
                  if (c.includes('Historical')) return '🏛️';
                  if (c.includes('Attraction')) return '📸';
                  if (c.includes('Hotel')) return '🏨';
                  return '📍';
                })()}
              </span>
              <span>{t(`dashboard.cat_${(place.category || '').toLowerCase()}`, place.category || '')}</span>
            </div>
            <h1 className="font-display tracking-tight text-4xl font-bold leading-tight mb-2">{place.name}</h1>
            <div className="flex items-center space-x-2">
              <span className="text-amber-500 text-lg mb-1">★</span>
              <span className="font-semibold text-lg">{place.rating || "4.5"}</span>
              <span className="text-slate-500 font-medium text-sm">({reviews.length} {t('details.reviews')})</span>
            </div>
          </div>
        </div>
      </div>

      <main className="px-6 mt-8 space-y-10">
        {/* Description */}
        <section style={{ animation: "fadeInUp 0.45s ease-out 0.1s both" }}>
          <h2 className="font-display tracking-tight text-2xl font-bold mb-3">{t('details.about')}</h2>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-[15px] transition-colors mb-6">{place.description}</p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
             {place.phone && (
               <a href={`tel:${place.phone}`} className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 rounded-2xl text-xs font-bold border border-transparent dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-sm">
                 <span>📞</span>
                 <span>{place.phone}</span>
               </a>
             )}
             {place.website && (
               <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 rounded-2xl text-xs font-bold border border-transparent dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-sm">
                 <span>🌐</span>
                 <span>Website</span>
               </a>
             )}
             {place.googleMapsUri && (
               <a href={place.googleMapsUri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 rounded-2xl text-xs font-bold border border-transparent dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-sm">
                 <span>📍</span>
                 <span>Maps</span>
               </a>
             )}
          </div>
        </section>

        {/* Opening Hours */}
        {place.openingHours && place.openingHours.length > 0 && (
           <section style={{ animation: "fadeInUp 0.45s ease-out 0.15s both" }}>
             <h2 className="font-display tracking-tight text-xl font-bold mb-3">Opening Hours</h2>
             <div className="glass-panel p-5 rounded-3xl border-none">
                <ul className="space-y-2">
                   {place.openingHours.map((day, idx) => (
                     <li key={idx} className="flex justify-between text-sm font-medium">
                        <span className={day.includes('Closed') ? 'text-red-400' : 'text-slate-500'}>{day.split(': ')[0]}</span>
                        <span className="text-slate-900 dark:text-gray-300">{day.split(': ')[1]}</span>
                     </li>
                   ))}
                </ul>
             </div>
           </section>
        )}

        {/* Gallery */}
        {place.gallery && place.gallery.length > 1 && (
          <section style={{ animation: "fadeInUp 0.45s ease-out 0.2s both" }}>
            <h2 className="font-display tracking-tight text-2xl font-bold mb-4">{t('details.photos', 'Gallery')}</h2>
            <div className="flex overflow-x-auto space-x-3 pb-4 scrollbar-hide -mx-6 px-6">
              {place.gallery.map((url, idx) => (
                <div key={idx} className="flex-none w-[150px] h-[150px] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-transparent dark:border-slate-700 bg-slate-200 dark:bg-slate-800">
                  <img src={url} alt={`${place.name} view ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Review Form */}
        <section className="glass-panel p-6 rounded-3xl border-none transition-colors" style={{ animation: "fadeInUp 0.45s ease-out 0.3s both" }}>
          <h2 className="font-display tracking-tight text-xl font-bold mb-4">{t('details.leave_review')}</h2>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('details.rating')}</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} type="button" onClick={() => setRating(num)}
                    className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all ${rating >= num ? 'bg-indigo-600 text-white shadow-sm scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide mt-4">{t('details.your_comment')}</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder={t('details.share_exp')} rows="3"
                className="w-full bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 text-sm font-medium border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-900 dark:text-white placeholder-[#a0978c] transition-all" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-950 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center space-x-2">
              {submitting
                ? <><svg className="w-5 h-5 spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><span>{t('details.posting')}</span></>
                : <span>{t('details.submit_review')}</span>
              }
            </button>
          </form>
        </section>

        {/* Reviews List */}
        <section style={{ animation: "fadeInUp 0.45s ease-out 0.4s both" }}>
          <h2 className="font-display tracking-tight text-2xl font-bold mb-6">{t('details.recent_reviews')}</h2>
          <div className="space-y-5">
            {reviews.length === 0 ? (
              <p className="text-slate-500 italic text-center py-4 glass-panel rounded-2xl border-none transition-colors">{t('details.first_review')}</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="glass-panel p-5 rounded-3xl shadow-sm border-none transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-indigo-600">
                        {rev.full_name?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight transition-colors">{rev.full_name}</h4>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">{new Date(rev.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="bg-indigo-50 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center text-indigo-600 font-bold text-sm shadow-sm">
                        <span className="mr-1">★</span> {rev.rating}
                      </div>
                      {rev.user_id === loggedInUserId && (
                        <button onClick={() => handleDeleteReview(rev.id)}
                          className="bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors">
                          {t('details.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium transition-colors">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PlaceDetails;
