// ═══════════════════════════════════════════════════════════════════════
// CONFIGURAZIONE DATABASE
// ═══════════════════════════════════════════════════════════════════════

const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'WorkflowProDB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'WorkFlow2025!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Pool connection singleton
let pool = null;

const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connessione database stabilita');
  }
  return pool;
};

module.exports = {
  sql,
  dbConfig,
  getPool
};
