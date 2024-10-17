// backend/app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';

// Define __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 30444;

// Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
});

app.use(limiter);
app.use(express.json());
app.use(cookieParser());

// CSRF Protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Serve static files from frontend
import path from 'path';
app.use(express.static(path.join(__dirname, '../frontend')));

// CSRF Token Route
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/files', fileRoutes);

// Error Handling
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
