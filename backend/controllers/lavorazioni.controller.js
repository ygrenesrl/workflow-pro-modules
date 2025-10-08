// ═══════════════════════════════════════════════════════════════════════
// CONTROLLER: LAVORAZIONI (Schema Esistente)
// Adattato alle colonne: LavorazioneId, Numero, RiferimentoPratica, Cliente, 
// Descrizione, Stato, Priorita, AssegnatarioId, DataCreazione, DataScadenza
// ═══════════════════════════════════════════════════════════════════════

const { getPool, sql } = require('../config/database');

// GET /api/lavorazioni - Lista tutte
exports.getAll = async (req, res, next) => {
  try {
    const { stato, data_inizio, data_fine } = req.query;

    const pool = await getPool();
    let query = `
      SELECT 
        l.LavorazioneId as id,
        l.Numero as numero,
        l.RiferimentoPratica as riferimento,
        l.Cliente as cliente,
        l.Descrizione as descrizione,
        l.Stato as stato,
        l.Priorita as priorita,
        l.AssegnatarioId as assegnatoA,
        l.DataCreazione as dataCreazione,
        l.DataScadenza as dataScadenza,
        l.DataCompletamento as dataCompletamento,
        u.FullName as assegnatoNome,
        (SELECT COUNT(*) FROM DocumentiLavorazione WHERE lavorazione_id = l.LavorazioneId) as numDocumenti
      FROM Lavorazioni l
      LEFT JOIN Users u ON l.AssegnatarioId = u.UserId
      WHERE 1=1
    `;

    const request = pool.request();

    if (stato) {
      query += ' AND l.Stato = @stato';
      request.input('stato', sql.NVarChar(50), stato);
    }

    if (data_inizio) {
      query += ' AND l.DataCreazione >= @data_inizio';
      request.input('data_inizio', sql.DateTime, new Date(data_inizio));
    }

    if (data_fine) {
      query += ' AND l.DataCreazione <= @data_fine';
      request.input('data_fine', sql.DateTime, new Date(data_fine));
    }

    query += ' ORDER BY l.DataCreazione DESC';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

// GET /api/lavorazioni/:id - Dettaglio con documenti
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Lavorazione
    const lav = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          l.LavorazioneId as id,
          l.Numero as numero,
          l.RiferimentoPratica as riferimento,
          l.Cliente as cliente,
          l.Descrizione as descrizione,
          l.Stato as stato,
          l.Priorita as priorita,
          l.AssegnatarioId as assegnatoA,
          l.DataCreazione as dataCreazione,
          l.DataScadenza as dataScadenza,
          l.DataCompletamento as dataCompletamento,
          u.FullName as assegnatoNome
        FROM Lavorazioni l
        LEFT JOIN Users u ON l.AssegnatarioId = u.UserId
        WHERE l.LavorazioneId = @id
      `);

    if (lav.recordset.length === 0) {
      return res.status(404).json({ error: 'Lavorazione non trovata' });
    }

    // Documenti associati
    const docs = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          d.*,
          t.nome as tipo_documento_nome,
          t.icona as tipo_documento_icona,
          t.colore as tipo_documento_colore
        FROM DocumentiLavorazione d
        LEFT JOIN TipiDocumento t ON d.tipo_documento_id = t.id
        WHERE d.lavorazione_id = @id
        ORDER BY d.data_caricamento DESC
      `);

    const result = {
      ...lav.recordset[0],
      documenti: docs.recordset
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/lavorazioni - Crea
exports.create = async (req, res, next) => {
  try {
    const { 
      numero, riferimento, cliente, descrizione, 
      stato, priorita, assegnatoA, dataScadenza 
    } = req.body;

    if (!numero && !cliente) {
      return res.status(400).json({ error: 'Numero o cliente obbligatorio' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('numero', sql.NVarChar(50), numero || null)
      .input('riferimento', sql.NVarChar(100), riferimento || null)
      .input('cliente', sql.NVarChar(200), cliente || null)
      .input('descrizione', sql.NVarChar(sql.MAX), descrizione || null)
      .input('stato', sql.NVarChar(50), stato || 'in_attesa')
      .input('priorita', sql.NVarChar(20), priorita || 'media')
      .input('assegnatoA', sql.Int, assegnatoA || null)
      .input('dataScadenza', sql.DateTime, dataScadenza ? new Date(dataScadenza) : null)
      .query(`
        INSERT INTO Lavorazioni 
          (Numero, RiferimentoPratica, Cliente, Descrizione, Stato, Priorita, AssegnatarioId, DataCreazione, DataScadenza)
        VALUES 
          (@numero, @riferimento, @cliente, @descrizione, @stato, @priorita, @assegnatoA, GETDATE(), @dataScadenza);

        SELECT 
          LavorazioneId as id,
          Numero as numero,
          RiferimentoPratica as riferimento,
          Cliente as cliente,
          Descrizione as descrizione,
          Stato as stato,
          Priorita as priorita,
          AssegnatarioId as assegnatoA,
          DataCreazione as dataCreazione,
          DataScadenza as dataScadenza
        FROM Lavorazioni 
        WHERE LavorazioneId = SCOPE_IDENTITY();
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/lavorazioni/:id - Aggiorna
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      numero, riferimento, cliente, descrizione, 
      stato, priorita, assegnatoA, dataScadenza 
    } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('numero', sql.NVarChar(50), numero)
      .input('riferimento', sql.NVarChar(100), riferimento)
      .input('cliente', sql.NVarChar(200), cliente)
      .input('descrizione', sql.NVarChar(sql.MAX), descrizione)
      .input('stato', sql.NVarChar(50), stato)
      .input('priorita', sql.NVarChar(20), priorita)
      .input('assegnatoA', sql.Int, assegnatoA)
      .input('dataScadenza', sql.DateTime, dataScadenza ? new Date(dataScadenza) : null)
      .query(`
        UPDATE Lavorazioni
        SET Numero = @numero, RiferimentoPratica = @riferimento, 
            Cliente = @cliente, Descrizione = @descrizione,
            Stato = @stato, Priorita = @priorita, 
            AssegnatarioId = @assegnatoA, DataScadenza = @dataScadenza
        WHERE LavorazioneId = @id;

        SELECT 
          LavorazioneId as id,
          Numero as numero,
          RiferimentoPratica as riferimento,
          Cliente as cliente,
          Descrizione as descrizione,
          Stato as stato,
          Priorita as priorita,
          AssegnatarioId as assegnatoA,
          DataCreazione as dataCreazione,
          DataScadenza as dataScadenza
        FROM Lavorazioni 
        WHERE LavorazioneId = @id;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Lavorazione non trovata' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/lavorazioni/:id/stato - Aggiorna solo stato
exports.updateStato = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stato } = req.body;

    if (!stato) {
      return res.status(400).json({ error: 'Stato obbligatorio' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('stato', sql.NVarChar(50), stato)
      .query(`
        UPDATE Lavorazioni 
        SET Stato = @stato, 
            DataCompletamento = CASE WHEN @stato = 'completata' THEN GETDATE() ELSE DataCompletamento END
        WHERE LavorazioneId = @id;

        SELECT 
          LavorazioneId as id,
          Stato as stato,
          DataCompletamento as dataCompletamento
        FROM Lavorazioni 
        WHERE LavorazioneId = @id;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Lavorazione non trovata' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/lavorazioni/:id - Elimina
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Verifica se ha documenti
    const docs = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM DocumentiLavorazione WHERE lavorazione_id = @id');

    if (docs.recordset[0].count > 0) {
      return res.status(409).json({ 
        error: 'Impossibile eliminare: lavorazione con documenti associati',
        documenti: docs.recordset[0].count
      });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Lavorazioni WHERE LavorazioneId = @id');

    res.json({ message: 'Lavorazione eliminata con successo' });
  } catch (err) {
    next(err);
  }
};
