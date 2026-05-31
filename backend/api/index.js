/**
 * Vercel Serverless Entry Point for Ratnamayuri Backend
 *
 * This file is the handler Vercel invokes for every /api/v1/* request.
 * It connects to MongoDB once (cached across warm invocations) then
 * delegates all routing to the Express app defined in src/app.js.
 *
 * ⚠️  Do NOT import server.js here — it runs child_process.fork and
 *     bootstrapAdmin/bootstrapDemoData which are incompatible with
 *     the serverless environment. The Express app itself (app.js) is
 *     already a clean, stateless handler.
 */

const app = require('../src/app');
const connectDB = require('../src/config/db');

let isConnected = false;

/**
 * Ensure the MongoDB connection is alive before handling a request.
 * Mongoose caches the connection internally, so this is effectively
 * a no-op after the first successful connection per Lambda instance.
 */
async function ensureConnection() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

/**
 * Vercel serverless function handler.
 * Signature: (req, res) — identical to an Express middleware.
 */
module.exports = async (req, res) => {
  try {
    await ensureConnection();
  } catch (err) {
    console.error('[Vercel] DB connection failed:', err.message);
    return res.status(503).json({ error: 'Database unavailable', detail: err.message });
  }

  // Delegate to the full Express app
  return app(req, res);
};
