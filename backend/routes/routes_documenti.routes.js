// ═══════════════════════════════════════════════════════════════════════
// ROUTES: DOCUMENTI E UPLOAD
// ═══════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const controller = require('../controllers/documenti.controller');
const { upload, handleUploadError } = require('../middleware/upload');

// Upload documento
router.post('/:id/documenti', upload.single('file'), handleUploadError, controller.upload);

// Lista documenti lavorazione
router.get('/:id/documenti', controller.getByLavorazione);

// Dettaglio documento (senza lavorazione_id)
router.get('/documenti/:id', controller.getById);

// Download documento
router.get('/documenti/:id/download', controller.download);

// Elimina documento
router.delete('/documenti/:id', controller.remove);

module.exports = router;
