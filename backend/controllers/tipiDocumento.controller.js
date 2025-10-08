// ═══════════════════════════════════════════════════════════════════════
// CONTROLLER: TIPI DOCUMENTO
// Logica business per gestione tipi documento
// ═══════════════════════════════════════════════════════════════════════

const { getPool, sql } = require('../config/database');

// GET /api/tipi-documento - Lista tutti
exports.getAll = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT * FROM TipiDocumento 
      WHERE attivo = 1
      ORDER BY ordine, nome
    `);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

// GET /api/tipi-documento/:id - Dettaglio
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM TipiDocumento WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Tipo documento non trovato' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/tipi-documento - Crea
exports.create = async (req, res, next) => {
  try {
    const { nome, descrizione, categoria, icona, colore, ordine } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome tipo documento obbligatorio' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('nome', sql.NVarChar(100), nome)
      .input('descrizione', sql.NVarChar(500), descrizione || null)
      .input('categoria', sql.NVarChar(50), categoria || null)
      .input('icona', sql.NVarChar(50), icona || 'insert_drive_file')
      .input('colore', sql.NVarChar(20), colore || 'grey')
      .input('ordine', sql.Int, ordine || 0)
      .query(`
        INSERT INTO TipiDocumento (nome, descrizione, categoria, icona, colore, ordine)
        VALUES (@nome, @descrizione, @categoria, @icona, @colore, @ordine);
        SELECT * FROM TipiDocumento WHERE id = SCOPE_IDENTITY();
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Tipo documento già esistente' });
    }
    next(err);
  }
};

// PUT /api/tipi-documento/:id - Aggiorna
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, descrizione, categoria, icona, colore, ordine, attivo } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('nome', sql.NVarChar(100), nome)
      .input('descrizione', sql.NVarChar(500), descrizione)
      .input('categoria', sql.NVarChar(50), categoria)
      .input('icona', sql.NVarChar(50), icona)
      .input('colore', sql.NVarChar(20), colore)
      .input('ordine', sql.Int, ordine)
      .input('attivo', sql.Bit, attivo !== false)
      .query(`
        UPDATE TipiDocumento
        SET nome = @nome, descrizione = @descrizione, categoria = @categoria,
            icona = @icona, colore = @colore, ordine = @ordine, 
            attivo = @attivo, data_modifica = GETDATE()
        WHERE id = @id;
        SELECT * FROM TipiDocumento WHERE id = @id;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Tipo documento non trovato' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tipi-documento/:id - Elimina (soft delete)
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Verifica se è usato
    const check = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM DocumentiLavorazione WHERE tipo_documento_id = @id');

    if (check.recordset[0].count > 0) {
      return res.status(409).json({ 
        error: 'Impossibile eliminare: tipo documento in uso',
        documenti_associati: check.recordset[0].count 
      });
    }

    // Soft delete
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE TipiDocumento SET attivo = 0 WHERE id = @id');

    res.json({ message: 'Tipo documento disattivato con successo' });
  } catch (err) {
    next(err);
  }
};
