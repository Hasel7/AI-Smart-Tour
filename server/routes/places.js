import express from "express";
import { query } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

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
  const { place_id } = req.body;
  const user_id = req.user.id;

  try {
    await query(
      "INSERT INTO saved_places (user_id, place_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [user_id, place_id]
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
// GET /api/places/saved
// ─────────────────────────────────────────
router.get("/saved", verifyToken, async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await query(`
      SELECT p.* FROM places p
      JOIN saved_places sp ON p.id = sp.place_id
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
