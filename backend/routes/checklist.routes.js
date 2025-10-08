// ═══════════════════════════════════════════════════════════════════════
// ROUTES: CHECKLIST
// ═══════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const controller = require('../controllers/checklist.controller');

// Checklist CRUD
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Domande checklist
router.get('/:id/domande', controller.getDomande);
router.post('/:id/domande', controller.createDomanda);
router.put('/domande/:id', controller.updateDomanda);
router.delete('/domande/:id', controller.removeDomanda);

module.exports = router;
