// ═══════════════════════════════════════════════════════════════════════
// ERROR HANDLER MIDDLEWARE
// Gestione centralizzata degli errori
// ═══════════════════════════════════════════════════════════════════════

module.exports = (err, req, res, next) => {
  console.error('═══════════════════════════════════════════════════════════════');
  console.error('ERROR:', err.message);
  console.error('PATH:', req.path);
  console.error('METHOD:', req.method);
  console.error('═══════════════════════════════════════════════════════════════');

  if (process.env.NODE_ENV === 'development') {
    console.error('STACK:', err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Errore interno del server';

  res.status(statusCode).json({
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
