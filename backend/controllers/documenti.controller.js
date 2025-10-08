// ═══════════════════════════════════════════════════════════════════════
// CONTROLLER: DOCUMENTI
// Logica business per upload e gestione documenti lavorazione
// ═══════════════════════════════════════════════════════════════════════

const { getPool, sql } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// POST /api/lavorazioni/:id/documenti - Upload documento
exports.upload = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tipo_documento_id, caricato_da_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    if (!tipo_documento_id) {
      // Cleanup file
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Tipo documento obbligatorio' });
    }

    const pool = await getPool();

    // Verifica lavorazione esiste
    const lavCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM Lavorazioni WHERE id = @id');

    if (lavCheck.recordset.length === 0) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'Lavorazione non trovata' });
    }

    // Salva record documento
    const result = await pool.request()
      .input('lavorazione_id', sql.Int, id)
      .input('tipo_documento_id', sql.Int, tipo_documento_id)
      .input('nome_file', sql.NVarChar(255), req.file.originalname)
      .input('path_file', sql.NVarChar(500), req.file.path)
      .input('dimensione_bytes', sql.BigInt, req.file.size)
      .input('mime_type', sql.NVarChar(100), req.file.mimetype)
      .input('caricato_da_id', sql.Int, caricato_da_id || null)
      .query(`
        INSERT INTO DocumentiLavorazione 
          (lavorazione_id, tipo_documento_id, nome_file, path_file, 
           dimensione_bytes, mime_type, caricato_da_id)
        VALUES 
          (@lavorazione_id, @tipo_documento_id, @nome_file, @path_file,
           @dimensione_bytes, @mime_type, @caricato_da_id);

        SELECT 
          d.*,
          t.nome as tipo_documento_nome,
          t.icona as tipo_documento_icona,
          t.colore as tipo_documento_colore,
          t.categoria as tipo_documento_categoria
        FROM DocumentiLavorazione d
        JOIN TipiDocumento t ON d.tipo_documento_id = t.id
        WHERE d.id = SCOPE_IDENTITY();
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    // Cleanup file in caso di errore
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
    }
    next(err);
  }
};

// GET /api/lavorazioni/:id/documenti - Lista documenti lavorazione
exports.getByLavorazione = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tipo_documento_id } = req.query;

    const pool = await getPool();

    let query = `
      SELECT 
        d.*,
        t.nome as tipo_documento_nome,
        t.icona as tipo_documento_icona,
        t.colore as tipo_documento_colore,
        t.categoria as tipo_documento_categoria
      FROM DocumentiLavorazione d
      LEFT JOIN TipiDocumento t ON d.tipo_documento_id = t.id
      WHERE d.lavorazione_id = @lavorazione_id
    `;

    if (tipo_documento_id) {
      query += ' AND d.tipo_documento_id = @tipo_documento_id';
    }

    query += ' ORDER BY d.data_caricamento DESC';

    const request = pool.request()
      .input('lavorazione_id', sql.Int, id);

    if (tipo_documento_id) {
      request.input('tipo_documento_id', sql.Int, tipo_documento_id);
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

// GET /api/documenti/:id - Dettaglio documento
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          d.*,
          t.nome as tipo_documento_nome,
          t.icona as tipo_documento_icona,
          t.colore as tipo_documento_colore
        FROM DocumentiLavorazione d
        LEFT JOIN TipiDocumento t ON d.tipo_documento_id = t.id
        WHERE d.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Documento non trovato' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/documenti/:id/download - Download file
exports.download = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT path_file, nome_file FROM DocumentiLavorazione WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Documento non trovato' });
    }

    const documento = result.recordset[0];

    // Verifica file esiste
    try {
      await fs.access(documento.path_file);
      res.download(documento.path_file, documento.nome_file);
    } catch {
      return res.status(404).json({ error: 'File fisico non trovato' });
    }
  } catch (err) {
    next(err);
  }
};

// DELETE /api/documenti/:id - Elimina documento
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Recupera path per eliminare file fisico
    const doc = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT path_file FROM DocumentiLavorazione WHERE id = @id');

    if (doc.recordset.length === 0) {
      return res.status(404).json({ error: 'Documento non trovato' });
    }

    const pathFile = doc.recordset[0].path_file;

    // Elimina record DB
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM DocumentiLavorazione WHERE id = @id');

    // Elimina file fisico
    try {
      await fs.unlink(pathFile);
    } catch (err) {
      console.warn('File fisico non trovato, record DB eliminato:', err.message);
    }

    res.json({ message: 'Documento eliminato con successo' });
  } catch (err) {
    next(err);
  }
};
