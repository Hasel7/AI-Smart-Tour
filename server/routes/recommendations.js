import express from "express";
import { verifyToken } from "../middleware/auth.js";

import { rankCandidates } from "../utils/recommendationEngine.js";

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// ─────────────────────────────────────────
// POST /api/recommendations
// Body: { liked_places: [], preferred_categories: [], top_n: 10 }
// ─────────────────────────────────────────
router.post("/", verifyToken, async (req, res) => {
    const { liked_places = [], preferred_categories = [], user_lat = null, user_lng = null, top_n = 6 } = req.body;
    
    try {
        let live_candidates = [];

        // ── 1. Fetch Live results from Google if location is provided ──
        if (user_lat && user_lng) {
            const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
            const googleUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${user_lat},${user_lng}&radius=5000&key=${GOOGLE_KEY}`;
            
            const gResponse = await fetch(googleUrl);
            const gData = await gResponse.json();
            
            if (gData.results && gData.results.length > 0) {
                // Only include places relevant to the 5 supported categories
                const allowedTypes = [
                    // Culture
                    'museum', 'art_gallery', 'library', 'tourist_attraction', 'amusement_park',
                    'aquarium', 'zoo', 'casino', 'movie_theater', 'night_club', 'bowling_alley',
                    // Dining
                    'restaurant', 'cafe', 'bar', 'food', 'bakery', 'meal_delivery', 'meal_takeaway',
                    // Hotels
                    'lodging',
                    // Nature
                    'park', 'natural_feature', 'campground',
                    // Sports
                    'gym', 'stadium', 'health', 'spa'
                ];

                live_candidates = gData.results
                    .filter(p => p.types && p.types.some(type => allowedTypes.includes(type)))
                    .map(p => ({
                        name: p.name,
                        category: p.types ? p.types[0].replace(/_/g, ' ') : "Attraction",
                        place_id: p.place_id,
                        rating: p.rating || 0,
                        latitude: p.geometry.location.lat,
                        longitude: p.geometry.location.lng,
                        photoUrl: p.photos && p.photos.length > 0 
                            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photos[0].photo_reference}&key=${GOOGLE_KEY}`
                            : null
                    }));
            }
        }

        // ── 2. NEW: Use native JS engine for ranking (No Python required!) ──
        const ranked = rankCandidates(live_candidates, {
            userLat: user_lat,
            userLng: user_lng,
            preferredCategories: preferred_categories,
            likedPlaces: liked_places
        });

        res.status(200).json({
            recommendations: ranked.slice(0, top_n),
            total: ranked.length
        });
    } catch (err) {
        console.error("Native Recommendation error:", err.message, err.cause || "");
        res.status(500).json({ message: "Recommendation engine error." });
    }
});

// ─────────────────────────────────────────
// POST /api/recommendations/score
// Body: { liked_places, preferred_categories, user_lat, user_lng, candidates: [{name, description, category, lat, lng}] }
// Scores and ranks an external list of places (e.g. from Google Places API)
// using the trained TF-IDF model — no DB records required for the candidates.
// ─────────────────────────────────────────
router.post("/score", verifyToken, async (req, res) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(`${ML_SERVICE_URL}/score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
            signal: controller.signal
        });
        if (!response.ok) throw new Error("ML service returned an error");
        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        console.error("Scoring error:", err.message, err.cause || "");
        res.status(503).json({ message: "Recommendation service unavailable." });
    } finally {
        clearTimeout(timeout);
    }
});

// ─────────────────────────────────────────
// GET /api/recommendations/similar/:name
// ─────────────────────────────────────────
router.get("/similar/:name", verifyToken, async (req, res) => {
    const { name } = req.params;
    const top_n = parseInt(req.query.top_n) || 5;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(
            `${ML_SERVICE_URL}/similar/${encodeURIComponent(name)}?top_n=${top_n}`,
            { signal: controller.signal }
        );
        if (!response.ok) throw new Error("ML service returned an error");
        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        console.error("Similar places error:", err.message, err.cause || "");
        res.status(503).json({ message: "Recommendation service unavailable." });
    } finally {
        clearTimeout(timeout);
    }
});

export default router;
