// ═══════════════════════════════════════════════════════════════════════
// CONTROLLER: USERS (Schema Esistente)
// Adattato alle colonne: UserId, Email, FullName, Role, IsActive, CreatedAt
// ═══════════════════════════════════════════════════════════════════════

const { getPool, sql } = require('../config/database');

// GET /api/users - Lista tutti
exports.getAll = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        UserId as id,
        Email as email,
        FullName as fullName,
        Role as role,
        IsActive as active,
        CreatedAt as createdAt
      FROM Users 
      ORDER BY FullName
    `);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id - Dettaglio
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          UserId as id,
          Email as email,
          FullName as fullName,
          Role as role,
          IsActive as active,
          CreatedAt as createdAt
        FROM Users 
        WHERE UserId = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/users - Crea
exports.create = async (req, res, next) => {
  try {
    const { fullName, email, role, active } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Nome completo e email obbligatori' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(200), email)
      .input('fullName', sql.NVarChar(200), fullName)
      .input('role', sql.NVarChar(50), role || 'user')
      .input('active', sql.Bit, active !== false)
      .query(`
        INSERT INTO Users (Email, FullName, Role, IsActive, CreatedAt)
        VALUES (@email, @fullName, @role, @active, GETDATE());

        SELECT 
          UserId as id,
          Email as email,
          FullName as fullName,
          Role as role,
          IsActive as active,
          CreatedAt as createdAt
        FROM Users 
        WHERE UserId = SCOPE_IDENTITY();
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email già esistente' });
    }
    next(err);
  }
};

// PUT /api/users/:id - Aggiorna
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, active } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('email', sql.NVarChar(200), email)
      .input('fullName', sql.NVarChar(200), fullName)
      .input('role', sql.NVarChar(50), role)
      .input('active', sql.Bit, active)
      .query(`
        UPDATE Users
        SET Email = @email, FullName = @fullName, Role = @role, IsActive = @active
        WHERE UserId = @id;

        SELECT 
          UserId as id,
          Email as email,
          FullName as fullName,
          Role as role,
          IsActive as active,
          CreatedAt as createdAt
        FROM Users 
        WHERE UserId = @id;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id - Elimina
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Users WHERE UserId = @id');

    res.json({ message: 'Utente eliminato con successo' });
  } catch (err) {
    next(err);
  }
};
