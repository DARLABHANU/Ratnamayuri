const rateLimits = new Map();

// Simple, robust in-memory rate limiter to prevent dependencies complexity
const rateLimiter = ({ windowMs, maxRequests, message }) => {
  // Prune map periodically to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of rateLimits.entries()) {
      const active = timestamps.filter(time => now - time < windowMs);
      if (active.length === 0) {
        rateLimits.delete(ip);
      } else {
        rateLimits.set(ip, active);
      }
    }
  }, 10 * 60 * 1000).unref(); // Clean up memory every 10 minutes

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, []);
    }
    
    const requestTimes = rateLimits.get(ip).filter(time => now - time < windowMs);
    requestTimes.push(now);
    rateLimits.set(ip, requestTimes);
    
    if (requestTimes.length > maxRequests) {
      return res.status(429).json({ 
        detail: message || 'Too many authentication attempts. Please wait a few minutes and try again.' 
      });
    }
    next();
  };
};

module.exports = rateLimiter;
