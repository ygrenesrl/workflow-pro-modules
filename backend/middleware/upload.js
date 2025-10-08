// ═══════════════════════════════════════════════════════════════════════
// MIDDLEWARE UPLOAD FILE
// Configurazione Multer per gestione upload documenti
// ═══════════════════════════════════════════════════════════════════════

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Crea directory uploads se non esiste
const uploadDir = path.join(__dirname, '../uploads');
fs.access(uploadDir).catch(() => fs.mkdir(uploadDir, { recursive: true }));

// Configurazione storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nome file: timestamp-random-nome_originale
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, uniqueSuffix + '-' + safeName + ext);
  }
});

// Filtro tipi file
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo file non supportato. Usa: PDF, JPG, PNG, DOC, DOCX'), false);
  }
};

// Configurazione multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB massimo
    files: 1 // 1 file per volta
  }
});

// Middleware per gestione errori upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File troppo grande. Massimo 10MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Troppi file. Carica un file alla volta' });
    }
    return res.status(400).json({ error: 'Errore upload: ' + err.message });
  }

  if (err) {
    return res.status(400).json({ error: err.message });
  }

  next();
};

module.exports = {
  upload,
  handleUploadError,
  uploadDir
};
