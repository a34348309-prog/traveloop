import { pool } from './index';

// --- Users ---
export async function createUser(name: string, email: string, passwordHash: string, phone?: string, city?: string, country?: string, role = 'user', additionalInfo?: string) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, phone, city, country, role, additional_info)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [name, email, passwordHash, phone, city, country || 'India', role, additionalInfo]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function getUserById(id: string) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateUser(id: string, updates: Partial<{name: string, email: string, phone: string, city: string, country: string, avatar_url: string}>) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return null;
  const setString = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map(k => (updates as any)[k]);
  const result = await pool.query(`UPDATE users SET ${setString} WHERE id = $1 RETURNING *`, [id, ...values]);
  return result.rows[0];
}

// --- Trips ---
export async function createTrip(userId: string, name: string, place: string, lat?: number, lng?: number, startDate?: string, endDate?: string, status = 'upcoming') {
  const result = await pool.query(
    `INSERT INTO trips (user_id, name, place, lat, lng, start_date, end_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, name, place, lat, lng, startDate, endDate, status]
  );
  return result.rows[0];
}

export async function getTripsByUserId(userId: string) {
  const result = await pool.query('SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
}

export async function getTripById(id: string) {
  const result = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateTrip(id: string, updates: any) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return null;
  const setString = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map(k => updates[k]);
  const result = await pool.query(`UPDATE trips SET ${setString} WHERE id = $1 RETURNING *`, [id, ...values]);
  return result.rows[0];
}

export async function deleteTrip(id: string) {
  await pool.query('DELETE FROM trips WHERE id = $1', [id]);
}

// --- Itinerary Items ---
export async function createItem(tripId: string, dayNumber: number, activityName: string, category: string, budget = 0, expense = 0, notes = '') {
  const result = await pool.query(
    `INSERT INTO itinerary_items (trip_id, day_number, activity_name, category, budget, expense, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tripId, dayNumber, activityName, category, budget, expense, notes]
  );
  return result.rows[0];
}

export async function getItemsByTripId(tripId: string) {
  const result = await pool.query('SELECT * FROM itinerary_items WHERE trip_id = $1 ORDER BY day_number ASC', [tripId]);
  return result.rows;
}

export async function updateItem(id: string, updates: any) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return null;
  const setString = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map(k => updates[k]);
  const result = await pool.query(`UPDATE itinerary_items SET ${setString} WHERE id = $1 RETURNING *`, [id, ...values]);
  return result.rows[0];
}

export async function deleteItem(id: string) {
  await pool.query('DELETE FROM itinerary_items WHERE id = $1', [id]);
}

// --- Expenses ---
export async function createExpense(tripId: string, category: string, description: string, qty = 1, unitCost = 0, amount = 0, paid = false) {
  const result = await pool.query(
    `INSERT INTO expenses (trip_id, category, description, qty, unit_cost, amount, paid)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tripId, category, description, qty, unitCost, amount, paid]
  );
  return result.rows[0];
}

export async function getExpensesByTripId(tripId: string) {
  const result = await pool.query('SELECT * FROM expenses WHERE trip_id = $1 ORDER BY created_at ASC', [tripId]);
  return result.rows;
}

export async function updateExpense(id: string, updates: any) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return null;
  const setString = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map(k => updates[k]);
  const result = await pool.query(`UPDATE expenses SET ${setString} WHERE id = $1 RETURNING *`, [id, ...values]);
  return result.rows[0];
}

export async function deleteExpense(id: string) {
  await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
}

// --- Packing Items ---
export async function createPackingItem(tripId: string, category: string, label: string, checked = false) {
  const result = await pool.query(
    `INSERT INTO packing_items (trip_id, category, label, checked) VALUES ($1, $2, $3, $4) RETURNING *`,
    [tripId, category, label, checked]
  );
  return result.rows[0];
}

export async function getPackingItemsByTripId(tripId: string) {
  const result = await pool.query('SELECT * FROM packing_items WHERE trip_id = $1 ORDER BY category ASC', [tripId]);
  return result.rows;
}

export async function updatePackingItem(id: string, checked: boolean) {
  const result = await pool.query('UPDATE packing_items SET checked = $2 WHERE id = $1 RETURNING *', [id, checked]);
  return result.rows[0];
}

// --- Community Posts ---
export async function createPost(userId: string, tripId: string | null, content: string) {
  const result = await pool.query(
    `INSERT INTO community_posts (user_id, trip_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [userId, tripId, content]
  );
  return result.rows[0];
}

export async function getAllPosts() {
  const result = await pool.query(`
    SELECT cp.*, u.name as user_name, u.avatar_url, t.name as trip_name, t.place as trip_place
    FROM community_posts cp
    JOIN users u ON cp.user_id = u.id
    LEFT JOIN trips t ON cp.trip_id = t.id
    ORDER BY cp.created_at DESC
  `);
  return result.rows;
}

export async function getPostById(id: string) {
  const result = await pool.query('SELECT * FROM community_posts WHERE id = $1', [id]);
  return result.rows[0];
}

// --- Trip Notes ---
export async function createNote(tripId: string, dayNumber: number, hotelName: string, roomType: string, breakfastIncluded: boolean, dateFrom: string, dateTo: string, content: string) {
  const result = await pool.query(
    `INSERT INTO trip_notes (trip_id, day_number, hotel_name, room_type, breakfast_included, date_from, date_to, content)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [tripId, dayNumber, hotelName, roomType, breakfastIncluded, dateFrom, dateTo, content]
  );
  return result.rows[0];
}

export async function getNotesByTripId(tripId: string) {
  const result = await pool.query('SELECT * FROM trip_notes WHERE trip_id = $1 ORDER BY day_number ASC', [tripId]);
  return result.rows;
}

export async function updateNote(id: string, updates: any) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return null;
  const setString = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map(k => updates[k]);
  const result = await pool.query(`UPDATE trip_notes SET ${setString} WHERE id = $1 RETURNING *`, [id, ...values]);
  return result.rows[0];
}
