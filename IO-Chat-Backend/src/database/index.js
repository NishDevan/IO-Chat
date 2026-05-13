import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add SSL if deploying to platforms like Heroku/Vercel that require it
  // ssl: { rejectUnauthorized: false }
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
