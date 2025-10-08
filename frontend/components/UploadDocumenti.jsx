import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, FormControl, InputLabel, Select,
  MenuItem, Alert, LinearProgress, List, ListItem, ListItemIcon,
  ListItemText, ListItemSecondaryAction, IconButton, Chip, Icon
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function UploadDocumenti({ lavorazioneId, onDocumentoCaricato, onDocumentoEliminato }) {
  const [tipiDocumento, setTipiDocumento] = useState([]);
  const [documenti, setDocumenti] = useState([]);
  const [tipoSelezionato, setTipoSelezionato] = useState('');
  const [fileSelezionato, setFileSelezionato] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    caricaTipiDocumento();
    if (lavorazioneId) {
      caricaDocumenti();
    }
  }, [lavorazioneId]);

  const caricaTipiDocumento = async () => {
    try {
      const response = await axios.get(`${API_URL}/tipi-documento`);
      setTipiDocumento(response.data);
    } catch (err) {
      console.error('Errore caricamento tipi:', err);
    }
  };

  const caricaDocumenti = async () => {
    try {
      const response = await axios.get(`${API_URL}/lavorazioni/${lavorazioneId}/documenti`);
      setDocumenti(response.data);
    } catch (err) {
      console.error('Errore caricamento documenti:', err);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Verifica dimensione (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File troppo grande. Dimensione massima: 10MB');
        event.target.value = null;
        return;
      }

      // Verifica tipo file
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 
                           'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo file non supportato. Usa: PDF, JPG, PNG, DOC, DOCX');
        event.target.value = null;
        return;
      }

      setFileSelezionato(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!fileSelezionato) {
      setError('Seleziona un file');
      return;
    }

    if (!tipoSelezionato) {
      setError('Seleziona il tipo di documento');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', fileSelezionato);
      formData.append('tipo_documento_id', tipoSelezionato);
      formData.append('caricato_da_id', 1); // TODO: prendere da sessione utente

      const response = await axios.post(
        `${API_URL}/lavorazioni/${lavorazioneId}/documenti`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setSuccess(`File "${fileSelezionato.name}" caricato con successo!`);
      setFileSelezionato(null);
      setTipoSelezionato('');

      // Reset input file
      document.getElementById('file-upload').value = null;

      // Ricarica lista documenti
      caricaDocumenti();

      // Notifica parent component
      if (onDocumentoCaricato) {
        onDocumentoCaricato(response.data);
      }

      // Nascondi messaggio successo dopo 3 secondi
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Errore upload:', err);
      setError(err.response?.data?.error || 'Errore durante il caricamento del file');
    } finally {
      setUploading(false);
    }
  };

  const handleElimina = async (documentoId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo documento?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/documenti/${documentoId}`);
      caricaDocumenti();

      if (onDocumentoEliminato) {
        onDocumentoEliminato(documentoId);
      }
    } catch (err) {
      console.error('Errore eliminazione:', err);
      alert('Errore durante l\'eliminazione del documento');
    }
  };

  const handleDownload = async (documentoId, nomeFile) => {
    try {
      const response = await axios.get(`${API_URL}/documenti/${documentoId}?download=true`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nomeFile);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Errore download:', err);
      alert('Errore durante il download del documento');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Sezione Upload */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Carica Nuovo Documento
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Selezione File */}
          <Box>
            <input
              id="file-upload"
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
              >
                {fileSelezionato ? fileSelezionato.name : 'Scegli File'}
              </Button>
            </label>
            {fileSelezionato && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Dimensione: {formatBytes(fileSelezionato.size)}
              </Typography>
            )}
          </Box>

          {/* Selezione Tipo Documento */}
          <FormControl fullWidth>
            <InputLabel>Tipo Documento *</InputLabel>
            <Select
              value={tipoSelezionato}
              label="Tipo Documento *"
              onChange={(e) => setTipoSelezionato(e.target.value)}
            >
              {tipiDocumento.map(tipo => (
                <MenuItem key={tipo.id} value={tipo.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon sx={{ color: `${tipo.colore}.main` }}>{tipo.icona}</Icon>
                    <span>{tipo.nome}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Bottone Upload */}
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!fileSelezionato || !tipoSelezionato || uploading}
            startIcon={<UploadIcon />}
          >
            {uploading ? 'Caricamento...' : 'Carica Documento'}
          </Button>

          {uploading && <LinearProgress />}
        </Box>
      </Paper>

      {/* Lista Documenti Caricati */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Documenti Caricati ({documenti.length})
        </Typography>

        {documenti.length === 0 ? (
          <Alert severity="info">
            Nessun documento caricato per questa lavorazione
          </Alert>
        ) : (
          <List>
            {documenti.map((doc) => (
              <ListItem
                key={doc.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemIcon>
                  <Icon sx={{ color: `${doc.tipo_documento_colore}.main` }}>
                    {doc.tipo_documento_icona}
                  </Icon>
                </ListItemIcon>
                <ListItemText
                  primary={doc.nome_file}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                      <Chip 
                        label={doc.tipo_documento_nome} 
                        size="small" 
                        sx={{ 
                          backgroundColor: `${doc.tipo_documento_colore}.100`,
                          color: `${doc.tipo_documento_colore}.800`
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatBytes(doc.dimensione_bytes)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(doc.data_caricamento).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDownload(doc.id, doc.nome_file)}
                    sx={{ mr: 1 }}
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => handleElimina(doc.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
