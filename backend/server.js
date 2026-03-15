/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – Express Server (server.js)
 * Entry point for the Node.js / Express backend.
 *
 * Connects to MongoDB, registers middleware, mounts routes,
 * and starts the HTTP server.
 * ═══════════════════════════════════════════════════════
 */

require('dotenv').config();

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

// ─── IMPORT ROUTES ───
const authRoutes     = require('./routes/auth.routes');
const wardrobeRoutes = require('./routes/wardrobe.routes');

// ─── CREATE EXPRESS APP ───
const app = express();

/* ═══════════════════════════════════════════════════════
   SECURITY MIDDLEWARE
   ═══════════════════════════════════════════════════════ */

// Helmet: sets security-related HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow image loading from frontend
  })
);

// CORS: allow requests from the frontend origin
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  // Add your production frontend URL here:
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  
  credentials:      true,
  methods:          ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization'],
}));
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5000",
    "https://vestra-s5i0.onrender.com"
  ],
  credentials: true
}));
/* ═══════════════════════════════════════════════════════
   RATE LIMITING
   ═══════════════════════════════════════════════════════ */

// General API rate limit: 200 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  message:  { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Strict limit for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { message: 'Too many auth attempts. Please wait 15 minutes.' },
});

/* ═══════════════════════════════════════════════════════
   GENERAL MIDDLEWARE
   ═══════════════════════════════════════════════════════ */

// JSON body parser (max 10MB for base64 images if needed)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger (dev mode: coloured output)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

/* ═══════════════════════════════════════════════════════
   STATIC FILES — serve uploaded images
   ═══════════════════════════════════════════════════════ */
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

/* ═══════════════════════════════════════════════════════
   HEALTH CHECK
   ═══════════════════════════════════════════════════════ */
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    service: 'Vestra API',
    version: '1.0.0',
    time:    new Date().toISOString(),
    db:      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get("/", (req, res) => {
  res.send("Vestra Backend Running 🚀");
});

/* ═══════════════════════════════════════════════════════
   API ROUTES
   ═══════════════════════════════════════════════════════ */
app.use('/api/auth',     authLimiter, apiLimiter, authRoutes);
app.use('/api/wardrobe', apiLimiter,  wardrobeRoutes);

/* ═══════════════════════════════════════════════════════
   SERVE FRONTEND (optional — for production single-server deploy)
   ═══════════════════════════════════════════════════════ */
if (process.env.SERVE_FRONTEND === 'true') {
  const frontendPath = path.join(__dirname, '../frontend');
  app.use(express.static(frontendPath));
  // SPA fallback
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

/* ═══════════════════════════════════════════════════════
   404 HANDLER
   ═══════════════════════════════════════════════════════ */
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.path} not found`,
  });
});

/* ═══════════════════════════════════════════════════════
   GLOBAL ERROR HANDLER
   ═══════════════════════════════════════════════════════ */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[Server Error]', err.stack || err.message);

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format.' });
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ message: `${field} already exists.` });
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token.' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error.',
  });
});





/* ═══════════════════════════════════════════════════════
   MONGODB CONNECTION + SERVER START
   ═══════════════════════════════════════════════════════ */
const PORT       = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
  try {
    console.log('🔌 Connecting to MongoDB…');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Vestra API running on http://localhost:${PORT}`);
      console.log(`📁 Uploads served at  http://localhost:${PORT}/uploads`);
      console.log(`💚 Health check at    http://localhost:${PORT}/health\n`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n[${signal}] Gracefully shutting down…`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed. Goodbye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app; // Export for testing
