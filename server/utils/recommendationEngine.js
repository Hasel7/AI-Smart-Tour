/**
 * Native JavaScript Recommendation Engine
 * Replaces the Python ML service for faster, simpler hybrid ranking.
 */

const haversineDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 10000;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const calculateKnowledgeScore = (placeCategory, preferredCategories = []) => {
    if (!preferredCategories || preferredCategories.length === 0) return 1.0;
    
    // Normalize categories for comparison
    const normalizedPref = preferredCategories.map(c => c.toLowerCase());
    const normalizedCat = placeCategory.toLowerCase();
    
    // Check for exact or partial matches
    if (normalizedPref.some(pref => normalizedCat.includes(pref) || pref.includes(normalizedCat))) {
        return 1.0;
    }
    return 0.2;
};

const calculateContentScore = (placeName, likedPlaces = []) => {
    if (!likedPlaces || likedPlaces.length === 0) return 0.0;
    
    const name = placeName.toLowerCase();
    let maxSim = 0;
    
    likedPlaces.forEach(liked => {
        const likedName = liked.toLowerCase();
        // Simple Jaccard-ish similarity or string inclusion
        if (name.includes(likedName) || likedName.includes(name)) {
            maxSim = Math.max(maxSim, 0.8);
        }
    });
    
    return maxSim;
};

export const rankCandidates = (candidates, { userLat, userLng, preferredCategories, likedPlaces }) => {
    return candidates.map(cand => {
        // 1. Proximity Score (40%)
        const dist = haversineDistance(userLat, userLng, cand.latitude, cand.longitude);
        const pScore = Math.exp(-dist / 20.0); // 1.0 at 0km, 0.08 at 50km
        
        // 2. Knowledge Score (20%)
        const kScore = calculateKnowledgeScore(cand.category, preferredCategories);
        
        // 3. Content Score (30%)
        const cScore = calculateContentScore(cand.name, likedPlaces);
        
        // 4. Rating Score (10%)
        const rScore = (cand.rating || 0) / 5.0;
        
        const totalScore = (pScore * 0.40) + (kScore * 0.20) + (cScore * 0.30) + (rScore * 0.10);
        
        return {
            id: cand.place_id || String(Math.random()),
            name: cand.name,
            category: cand.category,
            rating: cand.rating,
            score: Math.round(totalScore * 10000) / 10000,
            photoUrl: cand.photoUrl
        };
    })
    .sort((a, b) => b.score - a.score);
};
