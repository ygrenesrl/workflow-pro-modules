// ═══════════════════════════════════════════════════════════════════════
// ROUTER PRINCIPALE
// Aggrega tutti i router modulari
// ═══════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();

const checklistRoutes = require('./checklist.routes');
const documentiRoutes = require('./documenti.routes');
const tipiDocumentoRoutes = require('./tipiDocumento.routes');

// Mount routes
router.use('/checklist', checklistRoutes);
router.use('/documenti', documentiRoutes);
router.use('/lavorazioni', documentiRoutes); // Alias per documenti lavorazione
router.use('/tipi-documento', tipiDocumentoRoutes);

// Info route
router.get('/', (req, res) => {
  res.json({
    message: 'Workflow Pro API',
    version: '2.0.0',
    endpoints: [
      '/api/checklist',
      '/api/documenti',
      '/api/lavorazioni/:id/documenti',
      '/api/tipi-documento'
    ]
  });
});

module.exports = router;
