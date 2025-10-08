-- ═══════════════════════════════════════════════════════════════════════
-- WORKFLOW PRO - SCHEMA DATABASE COMPLETO
-- Crea tutte le tabelle necessarie con dati demo
-- ═══════════════════════════════════════════════════════════════════════

USE [WorkflowDB];
GO

-- ───────────────────────────────────────────────────────────────────────
-- TABELLA: Users
-- ───────────────────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        cognome NVARCHAR(100),
        email NVARCHAR(200) UNIQUE NOT NULL,
        ruolo NVARCHAR(50) DEFAULT 'user',
        attivo BIT DEFAULT 1,
        data_creazione DATETIME DEFAULT GETDATE(),
        data_modifica DATETIME
    );

    PRINT 'Tabella Users creata';

    -- Inserisci utenti demo
    INSERT INTO Users (nome, cognome, email, ruolo, attivo) VALUES
    ('Mario', 'Rossi', 'mario.rossi@workflow.com', 'admin', 1),
    ('Luigi', 'Verdi', 'luigi.verdi@workflow.com', 'operatore', 1),
    ('Anna', 'Bianchi', 'anna.bianchi@workflow.com', 'operatore', 1),
    ('Marco', 'Neri', 'marco.neri@workflow.com', 'user', 1),
    ('Giulia', 'Gialli', 'giulia.gialli@workflow.com', 'user', 1);

    PRINT '5 utenti demo inseriti';
END
ELSE
    PRINT 'Tabella Users già esistente';
GO

-- ───────────────────────────────────────────────────────────────────────
-- TABELLA: Lavorazioni
-- ───────────────────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Lavorazioni')
BEGIN
    CREATE TABLE Lavorazioni (
        id INT IDENTITY(1,1) PRIMARY KEY,
        titolo NVARCHAR(200) NOT NULL,
        descrizione NVARCHAR(MAX),
        cliente_id INT,
        assegnato_a_id INT,
        stato NVARCHAR(50) DEFAULT 'in_attesa',
        priorita NVARCHAR(20) DEFAULT 'media',
        data_scadenza DATETIME,
        data_creazione DATETIME DEFAULT GETDATE(),
        data_modifica DATETIME,
        FOREIGN KEY (assegnato_a_id) REFERENCES Users(id)
    );

    PRINT 'Tabella Lavorazioni creata';

    -- Inserisci lavorazioni demo
    INSERT INTO Lavorazioni (titolo, descrizione, assegnato_a_id, stato, priorita, data_scadenza) VALUES
    ('Analisi Pratica 001', 'Analisi documentazione per pratica nuova cliente', 2, 'in_corso', 'alta', DATEADD(day, 7, GETDATE())),
    ('Verifica Conformità Documenti', 'Controllo conformità documenti per certificazione', 3, 'in_attesa', 'media', DATEADD(day, 14, GETDATE())),
    ('Chiusura Pratica 045', 'Completamento pratica con archiviazione documenti', 2, 'completata', 'bassa', DATEADD(day, -5, GETDATE())),
    ('Revisione Contratto Cliente XYZ', 'Analisi e revisione contratto commerciale', 2, 'in_corso', 'alta', DATEADD(day, 3, GETDATE())),
    ('Preparazione Report Mensile', 'Compilazione report attività mese corrente', 3, 'in_attesa', 'media', DATEADD(day, 10, GETDATE())),
    ('Audit Interno Q3', 'Verifica procedure interne terzo trimestre', NULL, 'pianificata', 'alta', DATEADD(day, 30, GETDATE())),
    ('Formazione Nuovo Personale', 'Sessione formativa per 3 nuovi operatori', 1, 'in_corso', 'media', DATEADD(day, 5, GETDATE()));

    PRINT '7 lavorazioni demo inserite';
END
ELSE
    PRINT 'Tabella Lavorazioni già esistente';
GO

-- ───────────────────────────────────────────────────────────────────────
-- TABELLA: TipiDocumento
-- ───────────────────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TipiDocumento')
BEGIN
    CREATE TABLE TipiDocumento (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) UNIQUE NOT NULL,
        descrizione NVARCHAR(500),
        categoria NVARCHAR(50),
        icona NVARCHAR(50) DEFAULT 'insert_drive_file',
        colore NVARCHAR(20) DEFAULT 'grey',
        ordine INT DEFAULT 0,
        attivo BIT DEFAULT 1,
        data_creazione DATETIME DEFAULT GETDATE(),
        data_modifica DATETIME
    );

    PRINT 'Tabella TipiDocumento creata';

    -- Inserisci tipi documento demo
    INSERT INTO TipiDocumento (nome, descrizione, categoria, icona, colore, ordine, attivo) VALUES
    ('Documento Identità', 'Carta identità, patente, passaporto', 'Anagrafica', 'badge', 'blue', 1, 1),
    ('Contratto', 'Contratti commerciali e accordi', 'Legale', 'description', 'green', 2, 1),
    ('Fattura', 'Fatture attive e passive', 'Amministrativo', 'receipt', 'orange', 3, 1),
    ('Busta Paga', 'Cedolini e documenti retributivi', 'HR', 'payments', 'purple', 4, 1),
    ('Certificato', 'Certificazioni e attestati', 'Conformità', 'verified', 'teal', 5, 1),
    ('Visura', 'Visure camerali e catastali', 'Registri', 'article', 'indigo', 6, 1),
    ('Perizia', 'Perizie tecniche e valutazioni', 'Tecnico', 'assessment', 'red', 7, 1),
    ('Relazione', 'Relazioni tecniche e report', 'Reportistica', 'summarize', 'cyan', 8, 1),
    ('Planimetria', 'Planimetrie e disegni tecnici', 'Tecnico', 'map', 'brown', 9, 1),
    ('Fotografia', 'Foto documentali e sopralluoghi', 'Media', 'photo_camera', 'pink', 10, 1);

    PRINT '10 tipi documento inseriti';
END
ELSE
    PRINT 'Tabella TipiDocumento già esistente';
GO

-- ───────────────────────────────────────────────────────────────────────
-- TABELLA: DocumentiLavorazione
-- ───────────────────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DocumentiLavorazione')
BEGIN
    CREATE TABLE DocumentiLavorazione (
        id INT IDENTITY(1,1) PRIMARY KEY,
        lavorazione_id INT NOT NULL,
        tipo_documento_id INT,
        nome_file NVARCHAR(255) NOT NULL,
        path_file NVARCHAR(500) NOT NULL,
        contenuto_estratto NVARCHAR(MAX),
        dimensione_bytes BIGINT,
        mime_type NVARCHAR(100),
        caricato_da_id INT,
        data_caricamento DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (lavorazione_id) REFERENCES Lavorazioni(id),
        FOREIGN KEY (tipo_documento_id) REFERENCES TipiDocumento(id),
        FOREIGN KEY (caricato_da_id) REFERENCES Users(id)
    );

    CREATE INDEX IX_DocumentiLavorazione_Lavorazione ON DocumentiLavorazione(lavorazione_id);
    CREATE INDEX IX_DocumentiLavorazione_Tipo ON DocumentiLavorazione(tipo_documento_id);

    PRINT 'Tabella DocumentiLavorazione creata con indici';
END
ELSE
    PRINT 'Tabella DocumentiLavorazione già esistente';
GO

-- ───────────────────────────────────────────────────────────────────────
-- TABELLA: Checklist
-- ───────────────────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Checklist')
BEGIN
    CREATE TABLE Checklist (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(200) NOT NULL,
        descrizione NVARCHAR(MAX),
        versione NVARCHAR(20) DEFAULT '1.0',
        attiva BIT DEFAULT 1,
        creato_da_id INT,
        data_creazione DATETIME DEFAULT GETDATE(),
        data_modifica DATETIME,
        FOREIGN KEY (creato_da_id) REFERENCES Users(id)
    );

    PRINT 'Tabella Checklist creata';

    -- Inserisci checklist demo
    INSERT INTO Checklist (nome, descrizione, versione, attiva, creato_da_id) VALUES
    ('Verifica Conformità Documentale', 'Checklist standard per verifica conformità documenti', '1.0', 1, 1),
    ('Analisi Preliminare Pratica', 'Controlli iniziali su nuova pratica', '1.0', 1, 1),
    ('Chiusura Pratica Standard', 'Step per chiusura e archiviazione pratica', '1.0', 1, 1);

    PRINT '3 checklist demo inserite';
END
ELSE
    PRINT 'Tabella Checklist già esistente';
GO

-- ───────────────────────────────────────────────────────────────────────
-- TABELLA: ChecklistDomande
-- ───────────────────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChecklistDomande')
BEGIN
    CREATE TABLE ChecklistDomande (
        id INT IDENTITY(1,1) PRIMARY KEY,
        checklist_id INT NOT NULL,
        ordine INT DEFAULT 0,
        domanda NVARCHAR(MAX) NOT NULL,
        descrizione NVARCHAR(MAX),
        tipo_risposta NVARCHAR(50) DEFAULT 'Conforme/Non Conforme',
        prompt_ai NVARCHAR(MAX),
        documenti_richiesti NVARCHAR(MAX),
        obbligatoria BIT DEFAULT 1,
        FOREIGN KEY (checklist_id) REFERENCES Checklist(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_ChecklistDomande_Checklist ON ChecklistDomande(checklist_id);

    PRINT 'Tabella ChecklistDomande creata con indici';

    -- Inserisci domande demo per la prima checklist
    INSERT INTO ChecklistDomande (checklist_id, ordine, domanda, descrizione, tipo_risposta, prompt_ai, documenti_richiesti, obbligatoria) VALUES
    (1, 1, 'Il documento di identità è valido?', 'Verifica validità e leggibilità documento identità', 'Conforme/Non Conforme', 'Analizza il documento di identità e verifica: 1) Data di scadenza non superata, 2) Foto chiara e leggibile, 3) Dati anagrafici completi', '[1]', 1),
    (1, 2, 'Il contratto è firmato da tutte le parti?', 'Controllo firme su contratto', 'Conforme/Non Conforme', 'Analizza il contratto e verifica la presenza di tutte le firme richieste nelle sezioni appropriate', '[2]', 1),
    (1, 3, 'La fattura contiene tutti i dati fiscali obbligatori?', 'Verifica completezza dati fiscali fattura', 'Conforme/Non Conforme', 'Controlla che la fattura contenga: Partita IVA, Codice Fiscale, indirizzo completo, numero fattura, importi con IVA', '[3]', 1);

    PRINT '3 domande demo inserite per checklist 1';
END
ELSE
    PRINT 'Tabella ChecklistDomande già esistente';
GO

-- ───────────────────────────────────────────────────────────────────────
-- TABELLA: LavorazioneRisposte
-- ───────────────────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LavorazioneRisposte')
BEGIN
    CREATE TABLE LavorazioneRisposte (
        id INT IDENTITY(1,1) PRIMARY KEY,
        lavorazione_id INT NOT NULL,
        domanda_id INT NOT NULL,
        risposta_operatore NVARCHAR(MAX),
        risposta_ai NVARCHAR(MAX),
        confidenza_ai INT,
        documenti_analizzati NVARCHAR(MAX),
        tempo_elaborazione_ms INT,
        validata BIT DEFAULT 0,
        note NVARCHAR(MAX),
        compilata_da_id INT,
        data_compilazione DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (lavorazione_id) REFERENCES Lavorazioni(id),
        FOREIGN KEY (domanda_id) REFERENCES ChecklistDomande(id),
        FOREIGN KEY (compilata_da_id) REFERENCES Users(id)
    );

    CREATE INDEX IX_LavorazioneRisposte_Lavorazione ON LavorazioneRisposte(lavorazione_id);

    PRINT 'Tabella LavorazioneRisposte creata con indici';
END
ELSE
    PRINT 'Tabella LavorazioneRisposte già esistente';
GO

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICA FINALE
-- ═══════════════════════════════════════════════════════════════════════

PRINT '';
PRINT '═══════════════════════════════════════════════════════════════';
PRINT 'RIEPILOGO TABELLE CREATE:';
PRINT '═══════════════════════════════════════════════════════════════';

SELECT 
    name as [Tabella],
    create_date as [Data Creazione]
FROM sys.tables 
WHERE name IN ('Users', 'Lavorazioni', 'TipiDocumento', 'DocumentiLavorazione', 
               'Checklist', 'ChecklistDomande', 'LavorazioneRisposte')
ORDER BY name;

PRINT '';
PRINT '═══════════════════════════════════════════════════════════════';
PRINT 'DATI DEMO INSERITI:';
PRINT '═══════════════════════════════════════════════════════════════';

SELECT 'Users' as Tabella, COUNT(*) as Record FROM Users
UNION ALL
SELECT 'Lavorazioni', COUNT(*) FROM Lavorazioni
UNION ALL
SELECT 'TipiDocumento', COUNT(*) FROM TipiDocumento
UNION ALL
SELECT 'Checklist', COUNT(*) FROM Checklist
UNION ALL
SELECT 'ChecklistDomande', COUNT(*) FROM ChecklistDomande;

PRINT '';
PRINT '✅ SCHEMA DATABASE COMPLETO E FUNZIONANTE!';
PRINT '';
GO
