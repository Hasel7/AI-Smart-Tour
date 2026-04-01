import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PlaceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || '{}');
  const loggedInUserId = currentUser.id;

  useEffect(() => {
    const fetchPlaceAndReviews = async () => {
      try {
        setLoading(true);
        // Fetch specific place
        const placeRes = await fetch(`http://localhost:5000/api/places/${id}`);
        if (placeRes.ok) {
          const placeData = await placeRes.json();
          setPlace(placeData.place);
        } else {
          navigate("/dashboard"); // Redirect if it fails
          return;
        }

        // Fetch reviews
        const reviewRes = await fetch(`http://localhost:5000/api/places/${id}/reviews`);
        if (reviewRes.ok) {
          const reviewData = await reviewRes.json();
          setReviews(reviewData.reviews);
        }
      } catch (err) {
        console.error("Error fetching place details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceAndReviews();
  }, [id, navigate]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return alert("Please leave a comment!");

    const token = sessionStorage.getItem("token");
    if (!token) return alert("You must be logged in to leave a review.");

    try {
      setSubmitting(true);
      const res = await fetch(`http://localhost:5000/api/places/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (res.ok) {
        // Optimistically update the UI to avoid completely refreshing data
        setReviews([
          {
            id: Date.now(),
            rating,
            comment,
            user_id: loggedInUserId,
            full_name: currentUser.full_name || "Me",
            created_at: new Date().toISOString()
          },
          ...reviews
        ]);
        setComment("");
        setRating(5);
        alert("Review submitted!");
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    
    const token = sessionStorage.getItem("token");
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/places/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to delete review.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting review");
    }
  };

  if (loading) return (
     <div className="min-h-screen bg-[#faf8f1] flex items-center justify-center font-['Inter',sans-serif]">
       <p className="text-[#a0978c] animate-pulse">Loading amazing views...</p>
     </div>
  );

  if (!place) return null;

  return (
    <div className="min-h-screen bg-[#faf8f1] text-[#2f2722] font-['Inter',sans-serif] pb-24">
      {/* Hero Header */}
      <div className="h-[280px] bg-[#2f2722] text-white pt-10 px-6 relative rounded-b-[2.5rem] shadow-lg flex flex-col justify-end pb-8">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-10 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition backdrop-blur-sm shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-2 text-[#dcb35f] text-xs font-bold tracking-widest uppercase mb-2">
              <span>📍</span>
              <span>{place.category}</span>
            </div>
            <h1 className="font-['Playfair_Display',serif] text-4xl font-bold leading-tight mb-2">
              {place.name}
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-[#dcb35f] text-lg mb-1">★</span>
              <span className="font-semibold text-lg">{place.rating || "4.5"}</span>
              <span className="text-[#a0978c] font-medium text-sm">({reviews.length} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <main className="px-6 mt-8 space-y-10">
        
        {/* Description Section */}
        <section>
          <h2 className="font-['Playfair_Display',serif] text-2xl font-bold mb-3">About this place</h2>
          <p className="text-[#a0978c] leading-relaxed font-medium text-[15px]">
            {place.description}
          </p>
        </section>

        {/* Create Review Form */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-[#f0ece1]">
          <h2 className="font-['Playfair_Display',serif] text-xl font-bold mb-4">Leave a Review</h2>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#a0978c] mb-2 uppercase tracking-wide">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all ${rating >= num ? 'bg-[#c85a3c] text-white shadow-sm' : 'bg-[#f0ece1] text-[#a0978c] hover:bg-[#e6e1d4]'}`}
                  >
                     {num}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#a0978c] mb-2 uppercase tracking-wide mt-4">Your Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows="3"
                className="w-full bg-[#faf8f1] rounded-2xl p-4 text-sm font-medium border-none focus:ring-2 focus:ring-[#c85a3c] outline-none text-[#2f2722] placeholder-[#a0978c]"
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-[#2f2722] text-white font-bold py-3.5 rounded-2xl hover:bg-black transition-colors shadow-md disabled:bg-[#a0978c]"
            >
              {submitting ? "Posting..." : "Submit Review"}
            </button>
          </form>
        </section>

        {/* Reviews List */}
        <section>
          <h2 className="font-['Playfair_Display',serif] text-2xl font-bold mb-6">Recent Reviews</h2>
          
          <div className="space-y-5">
            {reviews.length === 0 ? (
              <p className="text-[#a0978c] italic text-center py-4 bg-[#f0ece1] rounded-2xl">Be the first to review this place!</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="bg-white p-5 rounded-3xl shadow-sm border border-[#f0ece1]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#e2dac9] rounded-full flex items-center justify-center font-bold text-[#c85a3c]">
                         {rev.full_name?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#2f2722] leading-tight">{rev.full_name}</h4>
                        <p className="text-[#a0978c] text-[10px] font-bold uppercase tracking-widest mt-0.5">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="bg-[#fff8ee] px-3 py-1 rounded-full flex items-center text-[#c85a3c] font-bold text-sm shadow-sm">
                         <span className="mr-1">★</span> {rev.rating}
                      </div>
                      {rev.user_id === loggedInUserId && (
                        <button 
                          onClick={() => handleDeleteReview(rev.id)}
                          className="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[#554e49] text-sm leading-relaxed font-medium">
                    {rev.comment}
                  </p>
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
