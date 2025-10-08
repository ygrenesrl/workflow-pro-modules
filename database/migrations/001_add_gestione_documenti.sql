-- ═══════════════════════════════════════════════════════════════════════
-- WORKFLOW PRO - GESTIONE DOCUMENTI E AI - PRIORITÀ 1
-- Script SQL per tabelle e modifiche database
-- ═══════════════════════════════════════════════════════════════════════

USE WorkflowProDB;
GO

PRINT '';
PRINT '═══════════════════════════════════════════════════════════════════════';
PRINT '  INSTALLAZIONE MODULO GESTIONE DOCUMENTI - PRIORITÀ 1';
PRINT '═══════════════════════════════════════════════════════════════════════';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════
-- TABELLA: TipiDocumento
-- ═══════════════════════════════════════════════════════════════════════
IF OBJECT_ID('TipiDocumento', 'U') IS NULL
BEGIN
    CREATE TABLE TipiDocumento (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL UNIQUE,
        descrizione NVARCHAR(500),
        categoria NVARCHAR(50),
        icona NVARCHAR(50),
        colore NVARCHAR(20),
        attivo BIT DEFAULT 1,
        ordine INT DEFAULT 0,
        data_creazione DATETIME DEFAULT GETDATE(),
        data_modifica DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Tabella TipiDocumento creata';
END
ELSE
BEGIN
    PRINT '⚠️  Tabella TipiDocumento già esistente';
END
GO

-- ═══════════════════════════════════════════════════════════════════════
-- MODIFICA: DocumentiLavorazione - Aggiungi tipo_documento_id
-- ═══════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('DocumentiLavorazione') 
               AND name = 'tipo_documento_id')
BEGIN
    ALTER TABLE DocumentiLavorazione
    ADD tipo_documento_id INT NULL;

    -- Aggiungi indice per performance
    CREATE INDEX IX_DocumentiLavorazione_TipoDocumento 
    ON DocumentiLavorazione(tipo_documento_id);

    PRINT '✅ Campo tipo_documento_id aggiunto a DocumentiLavorazione';
END
ELSE
BEGIN
    PRINT '⚠️  Campo tipo_documento_id già esistente';
END
GO

-- ═══════════════════════════════════════════════════════════════════════
-- MODIFICA: DocumentiLavorazione - Aggiungi contenuto_estratto
-- ═══════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('DocumentiLavorazione') 
               AND name = 'contenuto_estratto')
BEGIN
    ALTER TABLE DocumentiLavorazione
    ADD contenuto_estratto NVARCHAR(MAX) NULL;

    PRINT '✅ Campo contenuto_estratto aggiunto a DocumentiLavorazione';
END
ELSE
BEGIN
    PRINT '⚠️  Campo contenuto_estratto già esistente';
END
GO

-- ═══════════════════════════════════════════════════════════════════════
-- MODIFICA: LavorazioneRisposte - Aggiungi documenti_analizzati
-- ═══════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('LavorazioneRisposte') 
               AND name = 'documenti_analizzati')
BEGIN
    ALTER TABLE LavorazioneRisposte
    ADD documenti_analizzati NVARCHAR(MAX) NULL;

    PRINT '✅ Campo documenti_analizzati aggiunto a LavorazioneRisposte';
END
ELSE
BEGIN
    PRINT '⚠️  Campo documenti_analizzati già esistente';
END
GO

-- ═══════════════════════════════════════════════════════════════════════
-- MODIFICA: LavorazioneRisposte - Aggiungi tempo_elaborazione_ms
-- ═══════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('LavorazioneRisposte') 
               AND name = 'tempo_elaborazione_ms')
BEGIN
    ALTER TABLE LavorazioneRisposte
    ADD tempo_elaborazione_ms INT NULL;

    PRINT '✅ Campo tempo_elaborazione_ms aggiunto a LavorazioneRisposte';
END
ELSE
BEGIN
    PRINT '⚠️  Campo tempo_elaborazione_ms già esistente';
END
GO

PRINT '';
PRINT '═══════════════════════════════════════════════════════════════════════';
PRINT '  INSERIMENTO DATI DEMO - TIPI DOCUMENTO';
PRINT '═══════════════════════════════════════════════════════════════════════';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════
-- DATI DEMO: TipiDocumento
-- ═══════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM TipiDocumento)
BEGIN
    INSERT INTO TipiDocumento (nome, descrizione, categoria, icona, colore, ordine) VALUES
    (N'Documento Identità', N'Carta d''identità, patente, passaporto', N'Identità', 'badge', 'blue', 1),
    (N'Codice Fiscale', N'Tessera codice fiscale', N'Identità', 'fingerprint', 'blue', 2),
    (N'Contratto', N'Contratti di finanziamento, mutui, prestiti', N'Finanziario', 'description', 'green', 3),
    (N'Modulo Richiesta', N'Moduli compilati dal cliente', N'Amministrativo', 'assignment', 'orange', 4),
    (N'Attestazione Residenza', N'Bollette, certificati di residenza', N'Residenza', 'home', 'purple', 5),
    (N'Busta Paga', N'Cedolini stipendio', N'Reddito', 'account_balance_wallet', 'teal', 6),
    (N'Certificato', N'Certificati vari (matrimonio, nascita, etc.)', N'Certificati', 'verified', 'pink', 7),
    (N'Visura', N'Visure catastali, camerali', N'Visure', 'business', 'indigo', 8),
    (N'Estratto Conto', N'Estratti conto bancari', N'Finanziario', 'account_balance', 'green', 9),
    (N'Altro', N'Documenti non classificati', N'Altro', 'insert_drive_file', 'grey', 99);

    PRINT '✅ 10 tipi documento demo inseriti';
END
ELSE
BEGIN
    PRINT '⚠️  Tipi documento già presenti, skip inserimento';
END
GO

-- ═══════════════════════════════════════════════════════════════════════
-- AGGIORNAMENTO DOCUMENTI ESISTENTI (opzionale)
-- ═══════════════════════════════════════════════════════════════════════
-- Associa documenti esistenti ai tipi basandosi sul campo tipo_documento (stringa)
IF EXISTS (SELECT * FROM DocumentiLavorazione WHERE tipo_documento_id IS NULL)
BEGIN
    -- Mappa i tipi stringa ai nuovi ID
    UPDATE d
    SET d.tipo_documento_id = t.id
    FROM DocumentiLavorazione d
    JOIN TipiDocumento t ON d.tipo_documento = t.nome
    WHERE d.tipo_documento_id IS NULL;

    -- Assegna "Altro" a documenti non mappati
    UPDATE DocumentiLavorazione
    SET tipo_documento_id = (SELECT id FROM TipiDocumento WHERE nome = N'Altro')
    WHERE tipo_documento_id IS NULL;

    PRINT '✅ Documenti esistenti mappati ai tipi';
END
GO

PRINT '';
PRINT '═══════════════════════════════════════════════════════════════════════';
PRINT '  RIEPILOGO INSTALLAZIONE';
PRINT '═══════════════════════════════════════════════════════════════════════';
PRINT '';
PRINT '📊 Modifiche applicate:';
PRINT '   • Tabella TipiDocumento creata con 10 tipi demo';
PRINT '   • DocumentiLavorazione: +tipo_documento_id, +contenuto_estratto';
PRINT '   • LavorazioneRisposte: +documenti_analizzati, +tempo_elaborazione_ms';
PRINT '   • Indici per performance';
PRINT '';
PRINT '✅ Database aggiornato per gestione documenti!';
PRINT '';
PRINT '═══════════════════════════════════════════════════════════════════════';
GO
