import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://traveloop_user:traveloop123@localhost:5432/traveloop',
});

// Test connection and auto-migrate
pool.query('SELECT NOW()', async (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err.message);
  } else {
    console.log('Connected to PostgreSQL successfully at:', res.rows[0].now);
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT');
      console.log('Database schema checked.');
    } catch (e) {
      console.error('Error checking schema:', e);
    }
  }
});
