import * as SQLite from 'expo-sqlite';
import { citiesData, activitiesData } from '../constants/cities';

let db: SQLite.SQLiteDatabase;

export const initDB = async () => {
  db = await SQLite.openDatabaseAsync('traveloop.db');

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      photo_uri TEXT,
      phone TEXT,
      city TEXT,
      country TEXT DEFAULT 'India',
      language TEXT DEFAULT 'English',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      cover_photo_uri TEXT,
      is_public BOOLEAN DEFAULT 0,
      share_token TEXT,
      status TEXT DEFAULT 'upcoming',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      city_name TEXT NOT NULL,
      country TEXT,
      state TEXT,
      lat REAL,
      lng REAL,
      start_date TEXT,
      end_date TEXT,
      order_index INTEGER,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stop_id INTEGER,
      name TEXT NOT NULL,
      type TEXT,
      cost REAL,
      duration_mins INTEGER,
      description TEXT,
      image_uri TEXT,
      is_selected BOOLEAN DEFAULT 1,
      FOREIGN KEY(stop_id) REFERENCES stops(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      category TEXT CHECK(category IN ('transport', 'stay', 'activities', 'meals')),
      amount REAL,
      label TEXT,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      label TEXT,
      category TEXT CHECK(category IN ('clothing', 'documents', 'electronics', 'other')),
      is_packed BOOLEAN DEFAULT 0,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      stop_id INTEGER,
      content TEXT,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY(stop_id) REFERENCES stops(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS seed_cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      country TEXT,
      state TEXT,
      cost_index TEXT,
      lat REAL,
      lng REAL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS seed_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER,
      name TEXT,
      type TEXT,
      cost REAL,
      duration_mins INTEGER,
      description TEXT
    );
  `);

  await seedDB();
};

export const getDB = () => db;

const seedDB = async () => {
  const result = await db.getAllAsync('SELECT count(*) as count FROM seed_cities');
  if (result[0] && (result[0] as any).count > 0) {
    return; // Already seeded
  }

  console.log('Seeding Indian cities...');
  for (const city of citiesData) {
    const insertCity = await db.runAsync(
      'INSERT INTO seed_cities (name, country, state, cost_index, lat, lng, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [city.name, city.country, (city as any).state || '', city.cost_index, city.lat, city.lng, city.description]
    );

    const cityId = insertCity.lastInsertRowId;

    for (const act of activitiesData) {
      await db.runAsync(
        'INSERT INTO seed_activities (city_id, name, type, cost, duration_mins, description) VALUES (?, ?, ?, ?, ?, ?)',
        [cityId, act.name, act.type, act.cost, act.duration_mins, act.description]
      );
    }
  }
  console.log('Database seeded with Indian cities.');
};
