import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { query } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

dotenv.config();

const router = express.Router();

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { full_name, email, password, preferred_language } = req.body;

  // Basic validation
  if (!full_name || !email || !password) {
    return res.status(400).json({ message: "Full name, email and password are required." });
  }

  try {
    // Check if user already exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, preferred_language, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, preferred_language, role, created_at`,
      [full_name, email, password_hash, preferred_language || "gb", 'user']
    );

    const user = result.rows[0];

    // Create JWT token
    const token = jwt.sign({ id: user.id, role: user.role || "user" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // Find user by email
    const result = await query(
      "SELECT id, full_name, email, password_hash, preferred_language, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id, role: user.role || "user" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        preferred_language: user.preferred_language,
        role: user.role || 'user'
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─────────────────────────────────────────
// PUT /api/auth/profile
// ─────────────────────────────────────────
router.put("/profile", verifyToken, async (req, res) => {
  const user_id = req.user.id;
  const { preferred_language, full_name, password } = req.body;

  try {
    let updateFields = [];
    let queryValues = [];
    let idx = 1;

    if (preferred_language) {
      updateFields.push(`preferred_language = $${idx++}`);
      queryValues.push(preferred_language);
    }
    
    if (full_name) {
      updateFields.push(`full_name = $${idx++}`);
      queryValues.push(full_name);
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      updateFields.push(`password_hash = $${idx++}`);
      queryValues.push(password_hash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    queryValues.push(user_id);
    const queryString = `UPDATE users SET ${updateFields.join(", ")} WHERE id = $${idx} RETURNING id, full_name, email, preferred_language`;

    const result = await query(queryString, queryValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Profile updated successfully!",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ message: "Server error while updating profile." });
  }
});

export default router;
