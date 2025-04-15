const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error(err);

  // Default error status and message
  let status = 500;
  let message = 'Internal Server Error';
  let errors = null;

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    errors = err.errors;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = 'Resource Not Found';
  }

  // Send error response
  res.status(status).json({
    success: false,
    message: err.message || message,
    errors: errors,
    // Only include stack trace in development
    ...(process.env.APP_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
