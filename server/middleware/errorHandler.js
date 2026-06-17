export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const notFound = (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/healthz') {
    return res.status(404).json({ error: 'Not Found' });
  }
  next();
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  if (statusCode === 500) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  res.status(statusCode).json({ error: err.message });
};
