import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography,
  Box,
  Slider,
  Grid
} from '@mui/material';

// Önceden tanımlanmış zorluk seviyeleri
const DIFFICULTY_PRESETS = {
  easy: { width: 9, height: 9, mines: 10 },
  medium: { width: 16, height: 16, mines: 40 },
  hard: { width: 30, height: 16, mines: 99 },
  custom: { width: 9, height: 9, mines: 10 },
};

const GameSettings = ({ 
  open, 
  onClose, 
  onSave, 
  initialSettings = { width: 9, height: 9, mines: 10 } 
}) => {
  // State
  const [settings, setSettings] = useState(initialSettings);
  const [difficulty, setDifficulty] = useState(() => {
    // Başlangıç zorluğunu belirle
    const { width, height, mines } = initialSettings;
    
    if (width === 9 && height === 9 && mines === 10) return 'easy';
    if (width === 16 && height === 16 && mines === 40) return 'medium';
    if (width === 30 && height === 16 && mines === 99) return 'hard';
    
    return 'custom';
  });

  // Maksimum mayın sayısı
  const maxMines = Math.floor((settings.width * settings.height) * 0.35); // Tahta boyutunun %35'i kadar

  // Zorluk seviyesi değiştiğinde
  const handleDifficultyChange = (event) => {
    const selectedDifficulty = event.target.value;
    setDifficulty(selectedDifficulty);
    
    if (selectedDifficulty !== 'custom') {
      setSettings(DIFFICULTY_PRESETS[selectedDifficulty]);
    }
  };

  // Tahta genişliği değiştiğinde
  const handleWidthChange = (event, newValue) => {
    const newSettings = { ...settings, width: newValue };
    setSettings(newSettings);
    setDifficulty('custom');

    // Mayın sayısını güncelle
    if (newSettings.mines > Math.floor((newValue * newSettings.height) * 0.35)) {
      setSettings({
        ...newSettings,
        mines: Math.floor((newValue * newSettings.height) * 0.35)
      });
    }
  };

  // Tahta yüksekliği değiştiğinde
  const handleHeightChange = (event, newValue) => {
    const newSettings = { ...settings, height: newValue };
    setSettings(newSettings);
    setDifficulty('custom');

    // Mayın sayısını güncelle
    if (newSettings.mines > Math.floor((newSettings.width * newValue) * 0.35)) {
      setSettings({
        ...newSettings,
        mines: Math.floor((newSettings.width * newValue) * 0.35)
      });
    }
  };

  // Mayın sayısı değiştiğinde
  const handleMinesChange = (event, newValue) => {
    setSettings({ ...settings, mines: newValue });
    setDifficulty('custom');
  };

  // Ayarları kaydet
  const handleSave = () => {
    onSave(settings);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Oyun Ayarları</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, mt: 1 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="difficulty-select-label">Zorluk Seviyesi</InputLabel>
            <Select
              labelId="difficulty-select-label"
              id="difficulty-select"
              value={difficulty}
              label="Zorluk Seviyesi"
              onChange={handleDifficultyChange}
            >
              <MenuItem value="easy">Kolay (9x9, 10 mayın)</MenuItem>
              <MenuItem value="medium">Orta (16x16, 40 mayın)</MenuItem>
              <MenuItem value="hard">Zor (30x16, 99 mayın)</MenuItem>
              <MenuItem value="custom">Özel</MenuItem>
            </Select>
          </FormControl>

          <Typography gutterBottom>
            Tahta Genişliği: {settings.width}
          </Typography>
          <Slider
            value={settings.width}
            min={5}
            max={30}
            step={1}
            marks={[
              { value: 5, label: '5' },
              { value: 15, label: '15' },
              { value: 30, label: '30' },
            ]}
            onChange={handleWidthChange}
            aria-labelledby="width-slider"
          />

          <Typography gutterBottom sx={{ mt: 2 }}>
            Tahta Yüksekliği: {settings.height}
          </Typography>
          <Slider
            value={settings.height}
            min={5}
            max={20}
            step={1}
            marks={[
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 20, label: '20' },
            ]}
            onChange={handleHeightChange}
            aria-labelledby="height-slider"
          />

          <Typography gutterBottom sx={{ mt: 2 }}>
            Mayın Sayısı: {settings.mines}
          </Typography>
          <Slider
            value={settings.mines}
            min={1}
            max={maxMines}
            step={1}
            marks={[
              { value: 1, label: '1' },
              { value: maxMines, label: maxMines.toString() },
            ]}
            onChange={handleMinesChange}
            aria-labelledby="mines-slider"
          />
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Tahta Boyutu: {settings.width} x {settings.height} = {settings.width * settings.height} hücre
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mayın Yoğunluğu: {((settings.mines / (settings.width * settings.height)) * 100).toFixed(1)}%
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          İptal
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GameSettings; 