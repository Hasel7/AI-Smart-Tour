import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { query } from "../config/db.js";


dotenv.config();

const router = express.Router();

// Initialize the Gemini SDK
// It automatically picks up process.env.GEMINI_API_KEY
if (!process.env.GEMINI_API_KEY) {
  console.error("WARNING: GEMINI_API_KEY is not set in environment variables!");
} else {
  console.log("Gemini API Key loaded successfully.");
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Ensure saved_tours table exists
(async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS saved_tours (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        destination TEXT NOT NULL,
        itinerary JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Table saved_tours checked/created.");
  } catch (err) {
    console.error("Error creating saved_tours table:", err);
  }
})();


// Define the exact JSON structure we want the AI to return
const tourSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A catchy title for this tour",
    },
    destination: {
      type: Type.STRING,
      description: "The name of the city or region",
    },
    budget_estimate: {
      type: Type.STRING,
      description: "A short string estimating the budget (e.g., '$$ - Moderate')",
    },
    days: {
      type: Type.ARRAY,
      description: "An array of days in the itinerary",
      items: {
        type: Type.OBJECT,
        properties: {
          day_number: { type: Type.INTEGER },
          theme: { type: Type.STRING, description: "E.g., Historical Highlights" },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time_of_day: { 
                  type: Type.STRING, 
                  description: "Time of day (e.g. Morning, Afternoon) translated to the requested language" 
                },
                place_name: { type: Type.STRING },
                description: { type: Type.STRING, description: "1-2 sentences about the place" },
                duration: { type: Type.STRING, description: "E.g., 2 hours" },
                type: { 
                  type: Type.STRING, 
                  description: "Must be: CULTURE, DINING, NATURE, or HOTELS" 
                }
              },
              required: ["time_of_day", "place_name", "description", "duration", "type"]
            }
          }
        },
        required: ["day_number", "theme", "activities"]
      }
    }
  },
  required: ["title", "destination", "budget_estimate", "days"]
};

// ─────────────────────────────────────────
// POST /api/tours/generate
// ─────────────────────────────────────────
router.post("/generate", async (req, res) => {
  const { destination, days = 3, interests = "General sightseeing", language = "English", budget, pace } = req.body;

  if (!destination) {
    return res.status(400).json({ message: "Destination is required." });
  }

  try {
    let constraintsBlock = "";
    if (budget || pace) {
      constraintsBlock = `\nEXPLICIT KNOWLEDGE-BASED CONSTRAINTS:
- Budget Limit: ${budget || 'Any'}
- Travel Pace: ${pace || 'Any'}
You MUST rigidly enforce these constraints. Filter out any location or restaurant that violates them (e.g. no expensive hotels on a strict budget).`;
    }

    const prompt = `You are an expert Knowledge-Based AI travel recommender.
Create a ${days}-day smart travel itinerary for ${destination}. 
Focus heavily on these interests: ${interests}. ${constraintsBlock}

Ensure the activities flow logically and account for reasonable travel time.
IMPORTANT: The entire JSON response (including title, theme, place_name, and description strings) MUST be written explicitly in ${language}.`;

    // Call the Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: tourSchema,
        temperature: 0.7,
      }
    });

    // The SDK returns response.text as a string, but because we enforced JSON,
    // we can safely parse it into a JavaScript object.
    const itineraryData = JSON.parse(response.text);

    res.status(200).json({
      message: "Tour generated successfully",
      data: itineraryData,
    });
  } catch (error) {
    console.error("Tour generation error:", error);
    res.status(500).json({ message: "Failed to generate tour. Please try again." });
  }
});

// ─────────────────────────────────────────
// POST /api/tours/save
// ─────────────────────────────────────────
router.post("/save", async (req, res) => {
  const { title, destination, itinerary, user_id } = req.body;

  if (!title || !destination || !itinerary || !user_id) {
    return res.status(400).json({ message: "Missing required fields for saving tour." });
  }

  try {
    const result = await query(
      "INSERT INTO saved_tours (user_id, title, destination, itinerary) VALUES ($1, $2, $3, $4) RETURNING id",
      [user_id, title, destination, JSON.stringify(itinerary)]
    );

    res.status(201).json({
      message: "Tour saved successfully!",
      tourId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Save tour error:", error);
    res.status(500).json({ message: "Failed to save tour." });
  }
});

// ─────────────────────────────────────────
// GET /api/tours/saved/:userId
// ─────────────────────────────────────────
router.get("/saved/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await query(
      "SELECT * FROM saved_tours WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.status(200).json({
      message: "Saved tours fetched successfully",
      tours: result.rows,
    });
  } catch (error) {
    console.error("Fetch saved tours error:", error);
    res.status(500).json({ message: "Failed to fetch saved tours." });
  }
});

export default router;

