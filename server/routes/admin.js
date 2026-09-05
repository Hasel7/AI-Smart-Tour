import express from "express";
import { query } from "../config/db.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

// Apply admin protection to all routes in this file
router.use(verifyToken, verifyAdmin);

// ─────────────────────────────────────────
// USERS MANAGEMENT
// ─────────────────────────────────────────

// Fetch all users
router.get("/users", async (req, res) => {
  try {
    const result = await query("SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC");
    res.status(200).json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

// Delete a user
router.delete("/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await query("DELETE FROM users WHERE id = $1", [id]);
        res.status(200).json({ message: "User deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete user." });
    }
});

// Update user role
router.put("/users/:id/role", async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        await query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
        res.status(200).json({ message: "User role updated successfully." });
    } catch (err) {
        res.status(500).json({ message: "Failed to update role." });
    }
});

// ─────────────────────────────────────────
// DESTINATION (PLACES) MANAGEMENT
// ─────────────────────────────────────────

// Add a new place
router.post("/places", async (req, res) => {
    const { name, description, category, latitude, longitude, photo_url, rating } = req.body;
    try {
        const result = await query(
            "INSERT INTO places (name, description, category, latitude, longitude, photo_url, rating) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, description, category, latitude, longitude, photo_url, rating || 0]
        );
        res.status(201).json({ message: "Destination added!", place: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: "Failed to add destination." });
    }
});

// Update a place
router.put("/places/:id", async (req, res) => {
    const { id } = req.params;
    const { name, description, category, latitude, longitude, photo_url, rating } = req.body;
    try {
        await query(
            "UPDATE places SET name=$1, description=$2, category=$3, latitude=$4, longitude=$5, photo_url=$6, rating=$7 WHERE id=$8",
            [name, description, category, latitude, longitude, photo_url, rating, id]
        );
        res.status(200).json({ message: "Destination updated!" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update destination." });
    }
});

// Delete a place
router.delete("/places/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await query("DELETE FROM places WHERE id = $1", [id]);
        res.status(200).json({ message: "Destination deleted!" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete destination." });
    }
});

// ─────────────────────────────────────────
// REVIEWS MANAGEMENT
// ─────────────────────────────────────────

// Fetch all reviews for moderation
router.get("/reviews", async (req, res) => {
    try {
        const result = await query(`
            SELECT r.*, u.full_name as user_name, p.name as place_name 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN places p ON r.place_id = p.id::text
            ORDER BY r.created_at DESC
        `);
        res.status(200).json({ reviews: result.rows });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch reviews." });
    }
});

// Delete a review
router.delete("/reviews/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await query("DELETE FROM reviews WHERE id = $1", [id]);
        res.status(200).json({ message: "Review removed!" });
    } catch (err) {
        res.status(500).json({ message: "Failed to remove review." });
    }
});

export default router;
