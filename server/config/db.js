import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Ensure the Database URL exists
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined in the .env file.");
  process.exit(1);
}

// Supabase requires SSL connecton
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
