import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import authRoutes from "./routes/auth.js";
import toursRoutes from "./routes/tours.js";
import placesRoutes from "./routes/places.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tours", toursRoutes);
app.use("/api/places", placesRoutes);

app.get("/", (req, res) => {
  res.send("AI Smart-Tour API is running");
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('PostgreSQL (Supabase) connected successfully at:', res.rows[0].now);
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
});

