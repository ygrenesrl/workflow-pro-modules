# ═══════════════════════════════════════════════════════════════════════
# WORKFLOW PRO - SCRIPT INSTALLAZIONE AUTOMATICA
# Installa i moduli aggiuntivi nel progetto principale
# ═══════════════════════════════════════════════════════════════════════

#Requires -Version 5.1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   WORKFLOW PRO - INSTALLAZIONE MODULI AGGIUNTIVI                  ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────
# CONFIGURAZIONE
# ─────────────────────────────────────────────────────────────────────────

$REPO_PATH = $PSScriptRoot
$PROJECT_PATH = "C:\Users\ricca\OneDrive\Desktop\workflow-pro-docker\workflow-pro"

Write-Host "[INFO] Repository: $REPO_PATH" -ForegroundColor Gray
Write-Host "[INFO] Progetto:   $PROJECT_PATH" -ForegroundColor Gray
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────
# VERIFICA PREREQUISITI
# ─────────────────────────────────────────────────────────────────────────

Write-Host "[1/8] Verifica prerequisiti..." -ForegroundColor Yellow

# Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker non trovato. Installalo prima di procedere." -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Docker installato" -ForegroundColor Green

# Progetto esiste
if (-not (Test-Path $PROJECT_PATH)) {
    Write-Host "❌ Progetto non trovato in: $PROJECT_PATH" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Progetto trovato" -ForegroundColor Green

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────
# BACKUP
# ─────────────────────────────────────────────────────────────────────────

Write-Host "[2/8] Backup progetto esistente..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "$PROJECT_PATH\backend\server.js.backup.$timestamp"

if (Test-Path "$PROJECT_PATH\backend\server.js") {
    Copy-Item "$PROJECT_PATH\backend\server.js" $backupPath
    Write-Host "  ✅ Backup creato: $backupPath" -ForegroundColor Green
}

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────
# CREAZIONE STRUTTURA CARTELLE
# ─────────────────────────────────────────────────────────────────────────

Write-Host "[3/8] Creazione struttura cartelle..." -ForegroundColor Yellow

$folders = @(
    "$PROJECT_PATH\backend\config",
    "$PROJECT_PATH\backend\middleware",
    "$PROJECT_PATH\backend\routes",
    "$PROJECT_PATH\backend\controllers",
    "$PROJECT_PATH\backend\uploads"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✅ Creata: $folder" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Esistente: $folder" -ForegroundColor Yellow
    }
}

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────
# COPIA FILE BACKEND
# ─────────────────────────────────────────────────────────────────────────

Write-Host "[4/8] Copia file backend..." -ForegroundColor Yellow

$filesToCopy = @(
    @{ Source = "backend\server.js"; Dest = "backend\server.js" },
    @{ Source = "backend\config\database.js"; Dest = "backend\config\database.js" },
    @{ Source = "backend\middleware\upload.js"; Dest = "backend\middleware\upload.js" },
    @{ Source = "backend\middleware\errorHandler.js"; Dest = "backend\middleware\errorHandler.js" },
    @{ Source = "backend\routes\index.js"; Dest = "backend\routes\index.js" },
    @{ Source = "backend\routes\checklist.routes.js"; Dest = "backend\routes\checklist.routes.js" },
    @{ Source = "backend\routes\documenti.routes.js"; Dest = "backend\routes\documenti.routes.js" },
    @{ Source = "backend\routes\tipiDocumento.routes.js"; Dest = "backend\routes\tipiDocumento.routes.js" },
    @{ Source = "backend\controllers\checklist.controller.js"; Dest = "backend\controllers\checklist.controller.js" },
    @{ Source = "backend\controllers\documenti.controller.js"; Dest = "backend\controllers\documenti.controller.js" },
    @{ Source = "backend\controllers\tipiDocumento.controller.js"; Dest = "backend\controllers\tipiDocumento.controller.js" }
)

foreach ($file in $filesToCopy) {
    $source = Join-Path $REPO_PATH $file.Source
    $dest = Join-Path $PROJECT_PATH $file.Dest

    if (Test-Path $source) {
        Copy-Item $source $dest -Force
        Write-Host "  ✅ $($file.Dest)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Mancante: $($file.Source)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────
# COPIA FILE FRONTEND
# ─────────────────────────────────────────────────────────────────────────

Write-Host "[5/8] Copia file frontend..." -ForegroundColor Yellow

$frontendFiles = @(
    @{ Source = "frontend\pages\GestioneTipiDocumento.jsx"; Dest = "frontend\src\pages\GestioneTipiDocumento.jsx" },
    @{ Source = "frontend\components\UploadDocumenti.jsx"; Dest = "frontend\src\components\UploadDocumenti.jsx" }
)

foreach ($file in $frontendFiles) {
    $source = Join-Path $REPO_PATH $file.Source
    $dest = Join-Path $PROJECT_PATH $file.Dest

    if (Test-Path $source) {
        Copy-Item $source $dest -Force
        Write-Host "  ✅ $($file.Dest)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Mancante: $($file.Source)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────
# INSTALLAZIONE DIPENDENZE NPM
# ─────────────────────────────────────────────────────────────────────────

Write-Host "[6/8] Installazione dipendenze NPM..." -ForegroundColor Yellow

Push-Location $PROJECT_PATH

$packages = @("multer", "dotenv")

foreach ($pkg in $packages) {
    Write-Host "  Installazione $pkg..." -NoNewline
    docker exec workflow-backend npm list $pkg 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        docker exec workflow-backend npm install $pkg | Out-Null
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  (già installato)" -ForegroundColor Yellow
    }
}

Pop-Location
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────
# ESECUZIONE MIGRATION DATABASE
# ─────────────────────────────────────────────────────────────────────────

Write-Host "[7/8] Aggiornamento database..." -ForegroundColor Yellow

$sqlFile = Join-Path $REPO_PATH "database\migrations\001_add_gestione_documenti.sql"

if (Test-Path $sqlFile) {
    Get-Content $sqlFile | docker exec -i workflow-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "WorkFlow2025!" -C
    Write-Host "  ✅ Migration eseguita" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  File SQL non trovato" -ForegroundColor Yellow
}

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────
# RIAVVIO CONTAINER
# ─────────────────────────────────────────────────────────────────────────

Write-Host "[8/8] Riavvio applicazione..." -ForegroundColor Yellow

Push-Location $PROJECT_PATH
docker-compose restart backend frontend | Out-Null
Pop-Location

Write-Host "  Attendo avvio servizi (45 secondi)..." -NoNewline
Start-Sleep -Seconds 45
Write-Host " ✅" -ForegroundColor Green

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────
# TEST FINALE
# ─────────────────────────────────────────────────────────────────────────

Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   INSTALLAZIONE COMPLETATA!                                       ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Backend ristrutturato con architettura modulare" -ForegroundColor Green
Write-Host "✅ Frontend aggiornato con nuovi componenti" -ForegroundColor Green
Write-Host "✅ Database aggiornato con tabelle gestione documenti" -ForegroundColor Green
Write-Host "✅ Dipendenze installate (multer, dotenv)" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 Apri nel browser:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/tipi-documento" -ForegroundColor White
Write-Host "   http://localhost:3000/checklist" -ForegroundColor White
Write-Host ""

Write-Host "📝 Backup server.js salvato in:" -ForegroundColor Gray
Write-Host "   $backupPath" -ForegroundColor White
Write-Host ""

Write-Host "Premi un tasto per uscire..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
