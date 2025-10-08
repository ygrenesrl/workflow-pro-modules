import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Alert,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Grid, Icon
} from '@mui/icons-material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Icone disponibili Material-UI
const ICONE_DISPONIBILI = [
  'badge', 'fingerprint', 'description', 'assignment', 'home',
  'account_balance_wallet', 'verified', 'business', 'account_balance',
  'insert_drive_file', 'folder', 'picture_as_pdf', 'image',
  'article', 'receipt', 'work', 'card_membership'
];

// Colori disponibili
const COLORI_DISPONIBILI = [
  { nome: 'Blu', valore: 'blue' },
  { nome: 'Verde', valore: 'green' },
  { nome: 'Arancione', valore: 'orange' },
  { nome: 'Viola', valore: 'purple' },
  { nome: 'Rosso', valore: 'red' },
  { nome: 'Teal', valore: 'teal' },
  { nome: 'Rosa', valore: 'pink' },
  { nome: 'Indigo', valore: 'indigo' },
  { nome: 'Grigio', valore: 'grey' }
];

// Categorie disponibili
const CATEGORIE = [
  'Identità', 'Finanziario', 'Amministrativo', 'Residenza',
  'Reddito', 'Certificati', 'Visure', 'Altro'
];

export default function GestioneTipiDocumento() {
  const navigate = useNavigate();
  const [tipi, setTipi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogElimina, setDialogElimina] = useState({ open: false, id: null, nome: '' });
  const [editando, setEditando] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    categoria: '',
    icona: 'insert_drive_file',
    colore: 'grey',
    ordine: 0
  });

  useEffect(() => {
    caricaTipi();
  }, []);

  const caricaTipi = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/tipi-documento`);
      setTipi(response.data);
    } catch (err) {
      console.error('Errore caricamento tipi:', err);
      setError('Errore nel caricamento dei tipi documento');
    } finally {
      setLoading(false);
    }
  };

  const handleNuovo = () => {
    setFormData({
      nome: '',
      descrizione: '',
      categoria: '',
      icona: 'insert_drive_file',
      colore: 'grey',
      ordine: tipi.length + 1
    });
    setEditando(null);
    setDialogOpen(true);
  };

  const handleModifica = (tipo) => {
    setFormData({
      nome: tipo.nome,
      descrizione: tipo.descrizione || '',
      categoria: tipo.categoria || '',
      icona: tipo.icona || 'insert_drive_file',
      colore: tipo.colore || 'grey',
      ordine: tipo.ordine || 0
    });
    setEditando(tipo.id);
    setDialogOpen(true);
  };

  const handleSalva = async () => {
    try {
      if (!formData.nome.trim()) {
        alert('Il nome è obbligatorio');
        return;
      }

      if (editando) {
        await axios.put(`${API_URL}/tipi-documento/${editando}`, {
          ...formData,
          attivo: true
        });
      } else {
        await axios.post(`${API_URL}/tipi-documento`, formData);
      }

      setDialogOpen(false);
      caricaTipi();
    } catch (err) {
      console.error('Errore salvataggio:', err);
      if (err.response?.status === 409) {
        alert('Tipo documento già esistente');
      } else {
        alert('Errore durante il salvataggio');
      }
    }
  };

  const handleEliminaClick = (tipo) => {
    setDialogElimina({
      open: true,
      id: tipo.id,
      nome: tipo.nome
    });
  };

  const handleEliminaConferma = async () => {
    try {
      await axios.delete(`${API_URL}/tipi-documento/${dialogElimina.id}`);
      setDialogElimina({ open: false, id: null, nome: '' });
      caricaTipi();
    } catch (err) {
      console.error('Errore eliminazione:', err);
      if (err.response?.status === 409) {
        alert('Impossibile eliminare: tipo documento in uso');
      } else {
        alert('Errore durante l\'eliminazione');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestione Tipi Documento</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNuovo}
        >
          Nuovo Tipo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        I tipi documento definiti qui saranno disponibili per classificare i documenti caricati nelle lavorazioni
        e per configurare le checklist.
      </Alert>

      {/* Tabella Tipi */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Ordine</strong></TableCell>
              <TableCell><strong>Icona</strong></TableCell>
              <TableCell><strong>Nome</strong></TableCell>
              <TableCell><strong>Descrizione</strong></TableCell>
              <TableCell><strong>Categoria</strong></TableCell>
              <TableCell align="center"><strong>Azioni</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tipi.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    Nessun tipo documento configurato
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tipi.map((tipo) => (
                <TableRow key={tipo.id} hover>
                  <TableCell>{tipo.ordine}</TableCell>
                  <TableCell>
                    <Chip
                      icon={<Icon>{tipo.icona}</Icon>}
                      label={tipo.nome}
                      size="small"
                      sx={{ 
                        backgroundColor: `${tipo.colore}.100`,
                        color: `${tipo.colore}.800`
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {tipo.nome}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {tipo.descrizione || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={tipo.categoria || 'N/D'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleModifica(tipo)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleEliminaClick(tipo)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Modifica/Nuovo */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editando ? 'Modifica Tipo Documento' : 'Nuovo Tipo Documento'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nome *"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              margin="normal"
              helperText="Es: Documento Identità, Contratto, Busta Paga"
            />

            <TextField
              fullWidth
              label="Descrizione"
              value={formData.descrizione}
              onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={formData.categoria}
                    label="Categoria"
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  >
                    {CATEGORIE.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Ordine"
                  value={formData.ordine}
                  onChange={(e) => setFormData({ ...formData, ordine: parseInt(e.target.value) })}
                  helperText="Ordine visualizzazione"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Icona</InputLabel>
                  <Select
                    value={formData.icona}
                    label="Icona"
                    onChange={(e) => setFormData({ ...formData, icona: e.target.value })}
                  >
                    {ICONE_DISPONIBILI.map(icona => (
                      <MenuItem key={icona} value={icona}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon>{icona}</Icon>
                          <span>{icona}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Colore</InputLabel>
                  <Select
                    value={formData.colore}
                    label="Colore"
                    onChange={(e) => setFormData({ ...formData, colore: e.target.value })}
                  >
                    {COLORI_DISPONIBILI.map(col => (
                      <MenuItem key={col.valore} value={col.valore}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: 1,
                              backgroundColor: `${col.valore}.500`
                            }}
                          />
                          <span>{col.nome}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Anteprima */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Anteprima:
              </Typography>
              <Chip
                icon={<Icon>{formData.icona}</Icon>}
                label={formData.nome || 'Nome tipo documento'}
                sx={{ 
                  backgroundColor: `${formData.colore}.100`,
                  color: `${formData.colore}.800`
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleSalva} variant="contained" disabled={!formData.nome.trim()}>
            Salva
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Conferma Eliminazione */}
      <Dialog open={dialogElimina.open} onClose={() => setDialogElimina({ open: false, id: null, nome: '' })}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare il tipo documento "<strong>{dialogElimina.nome}</strong>"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Il tipo verrà disattivato. Se è in uso, l'eliminazione non sarà possibile.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogElimina({ open: false, id: null, nome: '' })}>
            Annulla
          </Button>
          <Button onClick={handleEliminaConferma} color="error" variant="contained">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
