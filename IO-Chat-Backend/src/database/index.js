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

export const initDb = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        favorite_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_favorite UNIQUE(user_id, favorite_user_id)
      );
    `);

    // Dynamically add favorite_chat_id column for group favoriting
    await query(`
      ALTER TABLE favorites ADD COLUMN IF NOT EXISTS favorite_chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE;
    `);

    // Dynamically add is_archived column to chat_members
    await query(`
      ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
    `);

    // Add constraints in try/catch to avoid crash if they already exist
    try {
      await query(`
        ALTER TABLE favorites ADD CONSTRAINT unique_user_chat_favorite UNIQUE(user_id, favorite_chat_id);
      `);
    } catch (e) {}

    try {
      await query(`
        ALTER TABLE favorites ADD CONSTRAINT check_only_one CHECK (
          (favorite_user_id IS NOT NULL AND favorite_chat_id IS NULL) OR
          (favorite_user_id IS NULL AND favorite_chat_id IS NOT NULL)
        );
      `);
    } catch (e) {}

    console.log("Database initialized: favorites and chat_members tables ensured.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
};

