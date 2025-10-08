// ═══════════════════════════════════════════════════════════════════════
// CONTROLLER: CHECKLIST
// Logica business per gestione checklist e domande
// ═══════════════════════════════════════════════════════════════════════

const { getPool, sql } = require('../config/database');

// ─────────────────────────────────────────────────────────────────────────
// CHECKLIST CRUD
// ─────────────────────────────────────────────────────────────────────────

// GET /api/checklist - Lista tutte
exports.getAll = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM ChecklistDomande WHERE checklist_id = c.id) as num_domande
      FROM Checklist c
      ORDER BY c.data_creazione DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

// GET /api/checklist/:id - Dettaglio
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Checklist WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Checklist non trovata' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/checklist - Crea
exports.create = async (req, res, next) => {
  try {
    const { nome, descrizione, versione, attiva, creato_da_id } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome checklist obbligatorio' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('nome', sql.NVarChar(200), nome)
      .input('descrizione', sql.NVarChar(sql.MAX), descrizione || null)
      .input('versione', sql.NVarChar(20), versione || '1.0')
      .input('attiva', sql.Bit, attiva !== false)
      .input('creato_da_id', sql.Int, creato_da_id || null)
      .query(`
        INSERT INTO Checklist (nome, descrizione, versione, attiva, creato_da_id)
        VALUES (@nome, @descrizione, @versione, @attiva, @creato_da_id);
        SELECT * FROM Checklist WHERE id = SCOPE_IDENTITY();
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/checklist/:id - Aggiorna
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, descrizione, versione, attiva } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('nome', sql.NVarChar(200), nome)
      .input('descrizione', sql.NVarChar(sql.MAX), descrizione)
      .input('versione', sql.NVarChar(20), versione)
      .input('attiva', sql.Bit, attiva)
      .query(`
        UPDATE Checklist 
        SET nome = @nome, descrizione = @descrizione, 
            versione = @versione, attiva = @attiva, data_modifica = GETDATE()
        WHERE id = @id;
        SELECT * FROM Checklist WHERE id = @id;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Checklist non trovata' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/checklist/:id - Elimina
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Verifica se usata in lavorazioni (opzionale, dipende dal tuo schema)
    // const check = await pool.request()
    //   .input('id', sql.Int, id)
    //   .query('SELECT COUNT(*) as count FROM Lavorazioni WHERE checklist_id = @id');
    // if (check.recordset[0].count > 0) {
    //   return res.status(409).json({ error: 'Checklist in uso' });
    // }

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Checklist WHERE id = @id');

    res.json({ message: 'Checklist eliminata con successo' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────
// DOMANDE CHECKLIST
// ─────────────────────────────────────────────────────────────────────────

// GET /api/checklist/:id/domande - Lista domande
exports.getDomande = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('checklist_id', sql.Int, id)
      .query('SELECT * FROM ChecklistDomande WHERE checklist_id = @checklist_id ORDER BY ordine');

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

// POST /api/checklist/:id/domande - Crea domanda
exports.createDomanda = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ordine, domanda, descrizione, tipo_risposta, prompt_ai, documenti_richiesti, obbligatoria } = req.body;

    if (!domanda || !domanda.trim()) {
      return res.status(400).json({ error: 'Testo domanda obbligatorio' });
    }

    const pool = await getPool();

    // Calcola ordine se non specificato
    let ordineFinale = ordine;
    if (!ordineFinale) {
      const maxOrdine = await pool.request()
        .input('checklist_id', sql.Int, id)
        .query('SELECT ISNULL(MAX(ordine), 0) as max_ordine FROM ChecklistDomande WHERE checklist_id = @checklist_id');
      ordineFinale = maxOrdine.recordset[0].max_ordine + 1;
    }

    const result = await pool.request()
      .input('checklist_id', sql.Int, id)
      .input('ordine', sql.Int, ordineFinale)
      .input('domanda', sql.NVarChar(sql.MAX), domanda)
      .input('descrizione', sql.NVarChar(sql.MAX), descrizione || null)
      .input('tipo_risposta', sql.NVarChar(50), tipo_risposta || 'Conforme/Non Conforme')
      .input('prompt_ai', sql.NVarChar(sql.MAX), prompt_ai || null)
      .input('documenti_richiesti', sql.NVarChar(sql.MAX), 
        typeof documenti_richiesti === 'string' ? documenti_richiesti : JSON.stringify(documenti_richiesti || []))
      .input('obbligatoria', sql.Bit, obbligatoria !== false)
      .query(`
        INSERT INTO ChecklistDomande 
          (checklist_id, ordine, domanda, descrizione, tipo_risposta, prompt_ai, documenti_richiesti, obbligatoria)
        VALUES 
          (@checklist_id, @ordine, @domanda, @descrizione, @tipo_risposta, @prompt_ai, @documenti_richiesti, @obbligatoria);
        SELECT * FROM ChecklistDomande WHERE id = SCOPE_IDENTITY();
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/domande/:id - Aggiorna domanda
exports.updateDomanda = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ordine, domanda, descrizione, tipo_risposta, prompt_ai, documenti_richiesti, obbligatoria } = req.body;

    if (!domanda || !domanda.trim()) {
      return res.status(400).json({ error: 'Testo domanda obbligatorio' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('ordine', sql.Int, ordine)
      .input('domanda', sql.NVarChar(sql.MAX), domanda)
      .input('descrizione', sql.NVarChar(sql.MAX), descrizione || null)
      .input('tipo_risposta', sql.NVarChar(50), tipo_risposta)
      .input('prompt_ai', sql.NVarChar(sql.MAX), prompt_ai || null)
      .input('documenti_richiesti', sql.NVarChar(sql.MAX), 
        typeof documenti_richiesti === 'string' ? documenti_richiesti : JSON.stringify(documenti_richiesti || []))
      .input('obbligatoria', sql.Bit, obbligatoria !== false)
      .query(`
        UPDATE ChecklistDomande
        SET ordine = @ordine, domanda = @domanda, descrizione = @descrizione,
            tipo_risposta = @tipo_risposta, prompt_ai = @prompt_ai,
            documenti_richiesti = @documenti_richiesti, obbligatoria = @obbligatoria
        WHERE id = @id;
        SELECT * FROM ChecklistDomande WHERE id = @id;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Domanda non trovata' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/domande/:id - Elimina domanda
exports.removeDomanda = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ChecklistDomande WHERE id = @id');

    res.json({ message: 'Domanda eliminata con successo' });
  } catch (err) {
    next(err);
  }
};
