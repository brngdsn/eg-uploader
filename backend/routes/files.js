// backend/routes/files.js
import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { files } from '../data/db.js';

const router = express.Router();
const jwtSecret = 'your_jwt_secret'; // Use a secure secret in production

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Setup for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files in the uploads directory
  },
  filename: (req, file, cb) => {
    // Use a unique filename to prevent overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage });

// Get Uploaded Files
router.get('/', authenticateToken, (req, res) => {
  res.json({ files });
});

// Upload New File
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  const file = {
    originalName: req.file.originalname,
    storedName: req.file.filename,
    size: req.file.size,
    path: req.file.path,
    extension: path.extname(req.file.originalname),
    mimetype: req.file.mimetype,
  };
  files.push(file);
  res.json({ message: 'File uploaded successfully' });
});

// Download File
router.get('/download/:storedName', authenticateToken, (req, res) => {
  const file = files.find(f => f.storedName === req.params.storedName);
  if (!file) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.download(file.path, file.originalName);
});

export default router;
