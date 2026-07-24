const express = require('express');
const cors = require('cors');
const config = require('./config');
const router = require('./routes');
const errorMiddleware = require('./middleware/error');

const app = express();
app.set('trust proxy', true);

// 1. STRICT CORS CONFIGURATION (Must be the very first middleware)
const allowedOrigins = [
  config.frontendUrl,                                         // Dynamically loaded frontend URL
  'https://ratnamayuri.vercel.app',                          // Production frontend
  'https://ratnamayuri-tbu8.vercel.app',                     // Early preview branch
  'https://ratnamayuri.me',                                   // Root custom domain
  'https://www.ratnamayuri.me',                               // WWW custom domain variation
  'http://localhost:3000'                                    // Local testing environment
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server or tools like Postman (which don't send an Origin header)
    if (!origin) return callback(null, true);
    
    // Check direct matching arrays OR evaluate dynamic vercel preview subdomains
    const isAllowed = allowedOrigins.includes(origin) || /https:\/\/ratnamayuri.*\.vercel\.app$/.test(origin);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy blockage: Origin ${origin} unauthorized`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// 2. Preflight Option Interceptor (Forces instant 200 OK responses to browser preflight validations)
app.options('*', cors());

// Body Parsing Middleware
app.use(express.json({ limit: 5242880 }));
app.use(express.urlencoded({ limit: 5242880, extended: true }));

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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/v1', router);

// Direct /api/create-order and /api/verify-payment endpoints
app.post('/api/create-order', (req, res, next) => require('./routes/orders').createOrderHandler(req, res, next));
app.post('/api/verify-payment', (req, res, next) => require('./routes/orders').verifyPaymentHandler(req, res, next));

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
