const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ message: 'Validation Error', errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate key error', field: err.keyValue });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // Scraper error handling
  if (err.message && (
    err.message.includes('User not found on') ||
    err.message.includes('Failed to fetch profile for')
  )) {
    return res.status(400).json({ message: err.message });
  }
  
  // Scraper timeout error
  if (err.message && err.message.includes('timed out')) {
    return res.status(408).json({ message: 'Profile fetch timed out. Please try again later.' });
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    message: err.message || 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { errorHandler };
