const express = require('express');
const cors = require('cors');
const config = require('./config');
const router = require('./routes');
const errorMiddleware = require('./middleware/error');

const app = express();

// CORS Middleware
app.use(cors({
  origin: [
    config.frontendUrl,
    'https://ratnamayuri-tbu8.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsing Middleware
app.use(express.json({ limit: 52428800 }));
app.use(express.urlencoded({ limit: 52428800, extended: true }));

// Static Files serving for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: config.appName,
    env: config.appEnv
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: `Welcome to ${config.appName} API`,
    docs: '/api/docs'
  });
});

// API Routes
app.use('/api/v1', router);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
