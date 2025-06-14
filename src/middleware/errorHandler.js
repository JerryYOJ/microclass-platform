// 404 Error Handler
const notFoundHandler = (req, res, next) => {
  console.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).send('<h1>404 Not Found</h1><p>The page you requested could not be found.</p>');
};

// General Error Handler
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Request Logger
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = {
  notFoundHandler,
  errorHandler,
  requestLogger
};