const errorMiddleware = (err, req, res, next) => {
  console.error(`Error on ${req.method} ${req.url}:`, err);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const detail = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({ detail });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ detail: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
  }

  // Default internal server error
  res.status(err.status || 500).json({
    detail: err.message || 'Internal server error'
  });
};

module.exports = errorMiddleware;
