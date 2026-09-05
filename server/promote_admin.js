import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/HP/Documents/Code Project/AI Smart-Tour/smart-tour/server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function promote() {
  try {
    await pool.query("UPDATE users SET role = 'admin' WHERE id = 4");
    console.log("User 4 promoted to Admin successfully");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
promote();
