import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import cron from 'node-cron';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:3000',
  'https://thinkboxmajor.onrender.com',
  process.env.RENDER_EXTERNAL_URL,
  process.env.CLIENT_URL // For custom frontend deployment
].filter(Boolean); // Remove undefined values

// Middleware - Configure CORS properly
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ThinkBox API is running!' });
});

// Test CORS
app.get('/api/test', (req, res) => {
  res.json({ message: 'CORS is working!', timestamp: new Date() });
});

// Error handling middleware for multer and file uploads
app.use((error, req, res, next) => {
  if (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File size too large. Maximum size is 50MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files uploaded.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({ message: 'Invalid file type. Allowed: images, PDF, DOCX, DOC, TXT files.' });
    }
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'File upload error.' });
  }
  next();
});

// Ping deployment server every 10 minutes to prevent sleep
cron.schedule('*/10 * * * *', async () => {
  try {
    // Use deployment URL from environment variable
    const url = process.env.RENDER_EXTERNAL_URL;
    if (!url) {
      console.warn('[CRON] RENDER_EXTERNAL_URL is not set in environment variables.');
      return;
    }
    await axios.get(url);
    console.log(`[CRON] Pinged ${url} at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[CRON] Failed to ping deployment server:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});