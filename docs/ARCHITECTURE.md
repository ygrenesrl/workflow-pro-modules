# 🏗️ Architettura Workflow Pro - Moduli Aggiuntivi

> Documentazione tecnica dell'architettura modulare e sistema gestione documenti con AI

## Indice

- [Panoramica](#panoramica)
- [Architettura Backend](#architettura-backend)
- [Architettura Frontend](#architettura-frontend)
- [Database Schema](#database-schema)
- [Flusso Dati](#flusso-dati)
- [Sicurezza](#sicurezza)
- [Performance](#performance)

## Panoramica

Questo sistema implementa un'architettura a microservizi modulare per Workflow Pro, con focus su:

- **Separazione delle responsabilità** (SoC)
- **Scalabilità orizzontale**
- **Manutenibilità del codice**
- **Testabilità automatizzata**

### Stack Tecnologico

**Backend:**
- Node.js 18+ con Express 4.x
- SQL Server 2019+
- Multer per upload file
- mssql driver nativo

**Frontend:**
- React 18+
- Material-UI 5
- Axios per HTTP requests
- React Router 6

**Infrastruttura:**
- Docker / Docker Compose
- Windows Server compatibile
- SQL Server in container

## Architettura Backend

### Struttura Modulare

```
backend/
├── server.js                 # Entry point (60 righe)
├── config/
│   └── database.js          # Pool connection singleton
├── middleware/
│   ├── upload.js            # Multer configuration
│   └── errorHandler.js      # Error handling globale
├── routes/
│   ├── index.js             # Aggregatore routes
│   ├── checklist.routes.js  # Route checklist
│   ├── documenti.routes.js  # Route upload/documenti
│   └── tipiDocumento.routes.js
└── controllers/
    ├── checklist.controller.js
    ├── documenti.controller.js
    └── tipiDocumento.controller.js
```

### Pattern Utilizzati

**1. Router Pattern**
Ogni risorsa ha il suo router dedicato che gestisce tutti gli endpoint correlati.

```javascript
// routes/tipiDocumento.routes.js
const router = express.Router();
const controller = require('../controllers/tipiDocumento.controller');

router.get('/', controller.getAll);
router.post('/', controller.create);
// ...
```

**2. Controller Pattern**
La logica business è separata dalle routes per facilitare testing e riuso.

```javascript
// controllers/tipiDocumento.controller.js
exports.getAll = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('...');
    res.json(result.recordset);
  } catch (err) {
    next(err); // Delegato a errorHandler
  }
};
```

**3. Middleware Chain Pattern**
Middleware componibili per cross-cutting concerns.

```javascript
router.post('/:id/documenti', 
  upload.single('file'),      // Upload file
  handleUploadError,          // Gestione errori upload
  controller.upload           // Business logic
);
```

### Database Connection Pool

**Singleton Pattern** per gestione pool connections:

```javascript
// config/database.js
let pool = null;

const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
};
```

**Vantaggi:**
- Connection reuse (riduce overhead)
- Automatic reconnection handling
- Configurazione centralizzata

## Architettura Frontend

### Componenti Riutilizzabili

**GestioneTipiDocumento.jsx** - Pagina CRUD completa
- Table con sorting/filtering
- Dialog forms per create/edit
- Validazione client-side
- Feedback utente immediato

**UploadDocumenti.jsx** - Componente upload standalone
- Drag & drop support
- Progress tracking
- Preview documenti
- Validazione tipo/dimensione

### State Management

Pattern **Lifting State Up** per comunicazione parent-child:

```javascript
<UploadDocumenti 
  lavorazioneId={id}
  onDocumentoCaricato={handleRefresh}  // Callback per refresh
/>
```

## Database Schema

### Tabelle Principali

**TipiDocumento**
```sql
CREATE TABLE TipiDocumento (
    id INT IDENTITY PRIMARY KEY,
    nome NVARCHAR(100) UNIQUE NOT NULL,
    categoria NVARCHAR(50),
    icona NVARCHAR(50),
    colore NVARCHAR(20),
    ordine INT DEFAULT 0,
    attivo BIT DEFAULT 1
);
```

**DocumentiLavorazione**
```sql
CREATE TABLE DocumentiLavorazione (
    id INT IDENTITY PRIMARY KEY,
    lavorazione_id INT NOT NULL,
    tipo_documento_id INT,  -- FK TipiDocumento
    nome_file NVARCHAR(255),
    path_file NVARCHAR(500),
    contenuto_estratto NVARCHAR(MAX),  -- OCR text
    dimensione_bytes BIGINT,
    data_caricamento DATETIME DEFAULT GETDATE()
);
```

### Relazioni

```
Lavorazioni 1 ─────── N DocumentiLavorazione
                              │
                              │ N ─────── 1 TipiDocumento
                              │
Checklist 1 ───────── N ChecklistDomande
    │                         │
    │                         │ documenti_richiesti (JSON)
    │                         └──────┐
    └──────────────────────────────┐│
                                   ││
LavorazioneRisposte N ─────────── 1│
    │                              │
    └─ documenti_analizzati (JSON)─┘
```

## Flusso Dati

### Upload Documento

```
┌─────────────┐
│   Client    │ 1. POST /api/lavorazioni/:id/documenti
│             │    FormData: file + tipo_documento_id
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Multer    │ 2. Valida file (tipo, dimensione)
│  Middleware │ 3. Salva su disco (uploads/)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │ 4. Verifica lavorazione esiste
│  Documenti  │ 5. Inserisce record DB
└──────┬──────┘    6. JOIN con TipiDocumento
       │
       ▼
┌─────────────┐
│  Database   │ 7. Transazione commit
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Client    │ 8. Response: documento + metadata
└─────────────┘
```

### Esecuzione Checklist con AI (PRIORITÀ 2)

```
┌─────────────┐
│  Operatore  │ 1. Apre lavorazione
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   System    │ 2. Carica checklist associata
│             │ 3. Per ogni domanda:
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Query     │ 4. Recupera documenti_richiesti (tipo_documento_id[])
│  Documenti  │ 5. Filtra DocumentiLavorazione per tipo
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Estrazione │ 6. OCR/parsing contenuto documenti
│  Contenuto  │ 7. Concatena testo estratto
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   AI API    │ 8. Compone prompt: [domanda] + [documenti]
│             │ 9. Chiama API AI (es. OpenAI, Azure)
└──────┬──────┘ 10. Riceve risposta + confidenza
       │
       ▼
┌─────────────┐
│    Salva    │ 11. INSERT LavorazioneRisposte
│   Risposta  │     - risposta_ai
└──────┬──────┘     - confidenza_ai (0-100)
       │            - documenti_analizzati (JSON)
       ▼            - tempo_elaborazione_ms
┌─────────────┐
│  Operatore  │ 12. Visualizza risposta AI
│             │ 13. Valida/modifica
└─────────────┘ 14. Conferma esito
```

## Sicurezza

### Upload File

**Validazioni implementate:**

1. **Tipo file** (whitelist)
   ```javascript
   const allowedMimes = ['application/pdf', 'image/jpeg', ...];
   ```

2. **Dimensione max** (10MB)
   ```javascript
   limits: { fileSize: 10 * 1024 * 1024 }
   ```

3. **Nome file sanitizzato**
   ```javascript
   const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
   ```

4. **Path traversal prevention**
   - File salvati in `uploads/` controlled directory
   - Nomi file generati con timestamp + random

### SQL Injection Prevention

**Prepared statements** su tutte le query:

```javascript
pool.request()
  .input('id', sql.Int, id)          // Type-safe parameters
  .query('SELECT * FROM ... WHERE id = @id');
```

### Error Handling

**No information leakage** in produzione:

```javascript
res.status(statusCode).json({
  error: message,
  ...(process.env.NODE_ENV === 'development' && { stack })
});
```

## Performance

### Ottimizzazioni Database

**Indici creati:**
```sql
CREATE INDEX IX_DocumentiLavorazione_TipoDocumento 
ON DocumentiLavorazione(tipo_documento_id);

CREATE INDEX IX_DocumentiLavorazione_Lavorazione 
ON DocumentiLavorazione(lavorazione_id);
```

**Connection pooling:**
```javascript
pool: {
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000
}
```

### Caching Strategy (TODO - PRIORITÀ 3)

**Tipi documento** (raramente cambiano):
- Cache in-memory con TTL 1h
- Invalidation su POST/PUT/DELETE

**Documenti lavorazione:**
- No cache (dati real-time)
- Possibile caching S3/CDN per file statici

### Monitoring (TODO - PRIORITÀ 3)

**Metriche da tracciare:**
- Tempo risposta API (p50, p95, p99)
- Upload success/failure rate
- Database query performance
- Memory usage backend
- Error rate per endpoint

---

**Versione:** 1.0.0  
**Data:** Ottobre 2025  
**Autori:** Ygrene SRL
