// ═══════════════════════════════════════════════════════════════════════
// WORKFLOW PRO - SERVER PRINCIPALE
// Entry point dell'applicazione backend - versione modulare
// ═══════════════════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────────────────────────────────
// MIDDLEWARE GLOBALI
// ─────────────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log richieste (opzionale, commentare in produzione)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ─────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Tutte le API sotto /api
app.use('/api', routes);

// ─────────────────────────────────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trovata' });
});

// Error Handler Middleware
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  WORKFLOW PRO - Backend Server');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  🚀 Server avviato sulla porta ${PORT}`);
  console.log(`  📅 ${new Date().toLocaleString()}`);
  console.log(`  🌐 http://localhost:${PORT}`);
  console.log(`  💚 Health: http://localhost:${PORT}/health`);
  console.log('═══════════════════════════════════════════════════════════════');
});

// Gestione shutdown graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM ricevuto, chiusura server...');
  process.exit(0);
});
