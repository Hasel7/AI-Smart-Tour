import pool from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from both server and client (to get Google Key)
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../client/.env') });

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY;

const query = (text, params) => pool.query(text, params);

// Helper to check if place exists
async function placeExists(name) {
    const res = await query("SELECT id FROM places WHERE name = $1", [name]);
    return res.rows.length > 0;
}

if (!GOOGLE_API_KEY) {
    console.error("❌ Error: VITE_GOOGLE_PLACES_API_KEY not found.");
    process.exit(1);
}

const CITIES = [
    "Enugu, Nigeria"
];

const CATEGORIES = [
    "cultural landmarks", "nature parks", "historical museums", 
    "hotels and resorts", "restaurants and cafes", "shopping malls",
    "tourist attractions"
];

async function seedData() {
    console.log("🚀 Starting Bulk Ingestion...");
    let totalAdded = 0;

    for (const city of CITIES) {
        for (const cat of CATEGORIES) {
            const searchText = `${cat} in ${city}`;
            console.log(`🔍 Searching: ${searchText}...`);

            try {
                const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
                    method: "POST",
                    headers: {
                        "X-Goog-Api-Key": GOOGLE_API_KEY,
                        "X-Goog-FieldMask": "places.displayName,places.location,places.primaryType,places.formattedAddress,places.id,places.rating,places.editorialSummary,places.types",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ 
                        textQuery: searchText,
                        maxResultCount: 5
                    })
                });

                const data = await response.json();

                if (data.places) {
                    for (const p of data.places) {
                        const name = p.displayName?.text;
                        const description = p.editorialSummary?.text || p.formattedAddress;
                        const latitude = p.location?.latitude;
                        const longitude = p.location?.longitude;
                        const rating = p.rating || 4.5;
                        
                        // Map category
                        let category = "Attraction";
                        const types = p.types || [];
                        if (types.includes("restaurant") || types.includes("food")) category = "Restaurant";
                        else if (types.includes("museum") || types.includes("art_gallery")) category = "Museum";
                        else if (types.includes("park") || types.includes("natural_feature")) category = "Nature";
                        else if (types.includes("lodging")) category = "Hotel";

                        // Insert into DB if not exists
                        try {
                            if (!(await placeExists(name))) {
                                await query(
                                    `INSERT INTO places (name, description, category, latitude, longitude, rating) 
                                     VALUES ($1, $2, $3, $4, $5, $6)`,
                                    [name, description, category, latitude, longitude, rating]
                                );
                                totalAdded++;
                            }
                        } catch (err) {
                            console.error(`❌ Failed to insert ${name}:`, err.message);
                        }
                    }
                }
            } catch (err) {
                console.error(`❌ Error searching for ${searchText}:`, err.message);
            }
        }
    }

    console.log(`\n✅ Finished! Added ${totalAdded} new premium destinations to your database.`);
    process.exit(0);
}

seedData();
