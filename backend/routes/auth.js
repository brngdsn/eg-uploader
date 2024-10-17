// backend/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { users } from '../data/db.js';

const router = express.Router();
const jwtSecret = 'your_jwt_secret'; // Use a secure secret in production
const tokenExpiry = '5m'; // Token expires in 5 minutes

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (user && await bcrypt.compare(password, user.passwordHash)) {
    const token = jwt.sign({ username }, jwtSecret, { expiresIn: tokenExpiry });
    res.cookie('token', token, { httpOnly: true });
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Register Route
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = users.find(u => u.username === username);

  if (existingUser) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ username, passwordHash });
  res.json({ message: 'Registration successful' });
});

router.get('/check', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err) => {
    if (err) return res.sendStatus(403);
    res.sendStatus(200);
  });
});

export default router;

