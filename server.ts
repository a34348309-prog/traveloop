import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getTripsByUserId, getUserByEmail, createUser } from './db/queries';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'traveloop_super_secret_key';
app.use(cors());
app.use(express.json());

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone, city, country, additional_info } = req.body;
    const existing = await getUserByEmail(email);
    if (existing) { return res.status(400).json({ error: 'User already exists' }); }
    
    const hash = await bcrypt.hash(password, 10);
    const user = await createUser(name, email, hash, phone, city, country, 'user', additional_info);
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user) { return res.status(400).json({ error: 'Invalid email or password' }); }
    
    const valid = await bcrypt.compare(password, user.password || '');
    if (!valid) { return res.status(400).json({ error: 'Invalid email or password' }); }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trips
app.get('/api/trips/:userId', async (req, res) => {
  try {
    const trips = await getTripsByUserId(req.params.userId);
    res.json(trips);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// More routes can be added here for other tables...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
