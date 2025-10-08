// ═══════════════════════════════════════════════════════════════════════
// ROUTER PRINCIPALE
// Aggrega tutti i router modulari
// ═══════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();

const usersRoutes = require('./users.routes');
const lavorazioniRoutes = require('./lavorazioni.routes');
const checklistRoutes = require('./checklist.routes');
const documentiRoutes = require('./documenti.routes');
const tipiDocumentoRoutes = require('./tipiDocumento.routes');

// Mount routes
router.use('/users', usersRoutes);
router.use('/lavorazioni', lavorazioniRoutes);
router.use('/checklist', checklistRoutes);
router.use('/documenti', documentiRoutes);
router.use('/tipi-documento', tipiDocumentoRoutes);

// Info route
router.get('/', (req, res) => {
  res.json({
    message: 'Workflow Pro API',
    version: '2.0.0',
    endpoints: [
      '/api/users',
      '/api/lavorazioni',
      '/api/checklist',
      '/api/documenti',
      '/api/lavorazioni/:id/documenti',
      '/api/tipi-documento'
    ]
  });
});

module.exports = router;
