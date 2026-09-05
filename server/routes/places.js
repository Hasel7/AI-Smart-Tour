import express from "express";
import { query } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ─────────────────────────────────────────
// Ensure saved_places table has required columns
// ─────────────────────────────────────────
(async () => {
  try {
    // We add category, rating, and photo_url columns if they don't exist to store Google Places metadata
    await query(`
      ALTER TABLE saved_places 
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS rating NUMERIC,
      ADD COLUMN IF NOT EXISTS photo_url TEXT;
    `);

    // Also ensure places table has photo_url (for admin and consistency)
    await query(`
      ALTER TABLE places 
      ADD COLUMN IF NOT EXISTS photo_url TEXT;
    `);
    console.log("Table saved_places schema checked/updated.");
  } catch (err) {
    console.error("Error updating saved_places table schema:", err);
  }
})();

// ─────────────────────────────────────────
// GET /api/places
// ─────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let sqlQuery = "SELECT * FROM places";
    let params = [];

    if (search) {
      // ILIKE is case-insensitive pattern matching in PostgreSQL
      sqlQuery += " WHERE name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1";
      params.push(`%${search}%`);
    }
    
    sqlQuery += " ORDER BY created_at DESC";

    const result = await query(sqlQuery, params);
    
    res.status(200).json({
      message: "Places fetched successfully",
      places: result.rows,
    });
  } catch (err) {
    console.error("Fetch places error:", err.message);
    res.status(500).json({ message: "Server error while fetching places." });
  }
});

// ─────────────────────────────────────────
// POST /api/places/save
// ─────────────────────────────────────────
router.post("/save", verifyToken, async (req, res) => {
  const { place_id, place_name, category, rating, photo_url } = req.body;
  const user_id = req.user.id;

  try {
    await query(
      "INSERT INTO saved_places (user_id, place_id, place_name, category, rating, photo_url) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
      [user_id, place_id, place_name || null, category || null, rating || null, photo_url || null]
    );
    res.status(200).json({ message: "Place saved successfully!" });
  } catch (err) {
    console.error("Save place error:", err.message);
    res.status(500).json({ message: "Failed to save place." });
  }
});

// ─────────────────────────────────────────
// DELETE /api/places/save/:placeId
// ─────────────────────────────────────────
router.delete("/save/:placeId", verifyToken, async (req, res) => {
  const { placeId } = req.params;
  const user_id = req.user.id;

  try {
    await query(
      "DELETE FROM saved_places WHERE user_id = $1 AND place_id = $2",
      [user_id, placeId]
    );
    res.status(200).json({ message: "Place removed from saved successfully!" });
  } catch (err) {
    console.error("Unsave place error:", err.message);
    res.status(500).json({ message: "Failed to remove saved place." });
  }
});

// ─────────────────────────────────────────
// PUT /api/places/save/:placeId (Metadata Update/Repair)
// ─────────────────────────────────────────
router.put("/save/:placeId", verifyToken, async (req, res) => {
  const { placeId } = req.params;
  const user_id = req.user.id;
  const { place_name, category, rating, photo_url } = req.body;

  try {
    const result = await query(
      "UPDATE saved_places SET place_name = $1, category = $2, rating = $3, photo_url = $4 WHERE user_id = $5 AND place_id = $6 RETURNING *",
      [place_name, category, rating, photo_url, user_id, placeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Saved place not found." });
    }

    res.status(200).json({ message: "Metadata updated successfully!", saved_place: result.rows[0] });
  } catch (err) {
    console.error("Update saved place error:", err.message);
    res.status(500).json({ message: "Failed to update metadata." });
  }
});

// ─────────────────────────────────────────
// GET /api/places/saved
// ─────────────────────────────────────────
router.get("/saved", verifyToken, async (req, res) => {
  const user_id = req.user.id;

  try {
    // Local places: join on numeric id. Google places: return name from saved_places directly.
    // We alias place_id AS id to match frontend expectations.
    const result = await query(`
      SELECT
        COALESCE(p.name, sp.place_name, 'Saved Place') AS name,
        sp.place_id AS id,
        sp.place_id,
        sp.created_at,
        COALESCE(p.category, sp.category, 'Attraction') AS category,
        COALESCE(p.rating, sp.rating, 4.5) AS rating,
        COALESCE(p.photo_url, sp.photo_url) AS photo_url
      FROM saved_places sp
      LEFT JOIN places p ON p.id::text = sp.place_id
      WHERE sp.user_id = $1
      ORDER BY sp.created_at DESC
    `, [user_id]);
    
    res.status(200).json({ saved_places: result.rows });
  } catch (err) {
    console.error("Fetch saved places error:", err.message);
    res.status(500).json({ message: "Failed to fetch saved places." });
  }
});

// ─────────────────────────────────────────
// GET /api/places/:placeId/reviews
// ─────────────────────────────────────────
router.get("/:placeId/reviews", async (req, res) => {
  const { placeId } = req.params;

  // If the ID is a string (e.g. Google Place ID), return empty reviews for now
  // to avoid 'invalid input syntax for type integer' DB errors
  if (isNaN(parseInt(placeId))) {
    return res.status(200).json({ reviews: [] });
  }

  try {
    const result = await query(`
      SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.full_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.place_id = $1
      ORDER BY r.created_at DESC
    `, [placeId]);
    
    res.status(200).json({ reviews: result.rows });
  } catch (err) {
    console.error("Fetch reviews error:", err.message);
    res.status(500).json({ message: "Failed to fetch reviews." });
  }
});

// ─────────────────────────────────────────
// GET /api/places/:id
// ─────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  
  // Prevent hitting this route for string literals that should match other routes
  if (id === "save" || id === "saved" || isNaN(parseInt(id))) {
      return next(); 
  }

  try {
    const result = await query("SELECT * FROM places WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Place not found." });
    }
    
    res.status(200).json({ place: result.rows[0] });
  } catch (err) {
    console.error("Fetch single place error:", err.message);
    res.status(500).json({ message: "Server error while fetching place details." });
  }
});

// ─────────────────────────────────────────
// POST /api/places/:placeId/reviews
// ─────────────────────────────────────────
router.post("/:placeId/reviews", verifyToken, async (req, res) => {
  const { placeId } = req.params;

  if (isNaN(parseInt(placeId))) {
    return res.status(400).json({ message: "Reviews are currently only supported for local destinations." });
  }

  const user_id = req.user.id;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  try {
    await query(
      "INSERT INTO reviews (user_id, place_id, rating, comment) VALUES ($1, $2, $3, $4)",
      [user_id, placeId, rating, comment]
    );
    res.status(201).json({ message: "Review added successfully!" });
  } catch (err) {
    console.error("Add review error:", err.message);
    res.status(500).json({ message: "Failed to add review." });
  }
});

// ─────────────────────────────────────────
// DELETE /api/places/reviews/:reviewId
// ─────────────────────────────────────────
router.delete("/reviews/:reviewId", verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const user_id = req.user.id;

  try {
    const result = await query(
      "DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id",
      [reviewId, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ message: "Not authorized to delete this review or review not found." });
    }

    res.status(200).json({ message: "Review deleted successfully!" });
  } catch (err) {
    console.error("Delete review error:", err.message);
    res.status(500).json({ message: "Failed to delete review." });
  }
});

export default router;
